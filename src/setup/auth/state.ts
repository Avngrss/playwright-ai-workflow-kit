import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { authConfig, envNames, forAccount, resolve, who, type Account } from "./auth-config";

/**
 * What the login code keeps between tests, workers and runs — all in the project's state/ (gitignored),
 * per app and role, named after the host they belong to (another stand → a fresh sign-in):
 *   <app>.<role>.<host>.session.json  a signed-in browser session
 *   <app>.<role>.<host>.api.json      API headers reused by every worker until they expire
 *   <app>.<role>.<host>.refresh.json  the latest refresh token (api: refresh-token)
 *   <app>.<role>.<host>.failed.json   a refused sign-in: never tried again with the same login and password
 *   <app>.<role>.<host>.<name>.lock   one worker signs in at a time; the others wait and reuse its result
 */

const STATE_DIR = path.resolve(__dirname, "..", "..", "..", "state");
// Both under a sign-in fixture's 90 s budget (auth.fixture.ts), so a lock left by a killed run says so.
const LOCK_WAIT_MS = 80_000;
const LOCK_STALE_MS = 60_000;

/** The host the files are named after: the app's, or — without a web UI — the API's or the identity provider's. */
function host(platform: string): string {
  const { ui, api } = authConfig(platform);
  for (const candidate of [ui.mode === "none" ? undefined : ui.start, api.tokenUrl, api.loginUrl]) {
    if (!candidate) continue;
    try {
      return new URL(resolve(candidate)).hostname;
    } catch {
      // not a full URL yet (a missing .env value is reported where it is used)
    }
  }
  return "local";
}

export function stateFile({ platform, role }: Account, kind: string): string {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  return path.join(STATE_DIR, `${platform}.${role}.${host(platform)}.${kind}.json`);
}

export function readState<T>(account: Account, kind: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(stateFile(account, kind), "utf8")) as T;
  } catch {
    return undefined;
  }
}

export function writeState(account: Account, kind: string, value: unknown): void {
  fs.writeFileSync(stateFile(account, kind), JSON.stringify(value), "utf8");
}

export function forgetState(account: Account, kind: string): void {
  fs.rmSync(stateFile(account, kind), { force: true });
}

/** The account's login, password and other secrets as .env holds them now — hashed, never stored. */
function credentialsHash(account: Account): string {
  const { ui, api } = authConfig(account.platform);
  const templates = [ui.login, ui.password, api.key ?? "", ...api.tokenFields.map(([, value]) => value), ...api.loginBody.map(([, value]) => value)];
  const names = [...new Set(templates.flatMap((template) => envNames(forAccount(template, account), account.role)))].sort();
  return createHash("sha256").update(names.map((name) => `${name}=${process.env[name] ?? ""}`).join("\n")).digest("hex");
}

/**
 * Stops before a sign-in that would repeat a refused one. Repeated wrong passwords lock accounts, so
 * the same login and password are never tried again — no timer, however long — until .env holds
 * other ones (then one new attempt) or the file is deleted once they work in a browser by hand.
 */
export function throwIfPaused(account: Account): void {
  const file = stateFile(account, "failed");
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  let refusal: { message: string; credentials?: string };
  try {
    refusal = JSON.parse(text);
  } catch {
    refusal = { message: text }; // written before refusals named their credentials
  }
  const relative = path.relative(process.cwd(), file);
  if (refusal.credentials === credentialsHash(account)) {
    throw new Error(
      `${refusal.message} (not tried again with the same login and password — repeated wrong passwords lock the account. ` +
        `Change them in .env; or, once they work in a browser by hand, delete ${relative})`,
    );
  }
  // A refusal that names no credentials (written by an older template) holds until the file is deleted: no timer
  // knows the service's lockout (one locks 30 minutes after 3 tries), so time never lifts a refusal.
  if (refusal.credentials === undefined) {
    throw new Error(`${refusal.message} (not tried again — repeated wrong passwords lock the account. Once the login works in a browser by hand, delete ${relative})`);
  }
}

export function markRefused(account: Account, message: string): void {
  fs.writeFileSync(stateFile(account, "failed"), JSON.stringify({ message, credentials: credentialsHash(account) }), "utf8");
}

export function clearRefused(account: Account): void {
  forgetState(account, "failed");
}

/**
 * Runs `work` while holding the account's `name` lock, so parallel workers sign in once instead of
 * once each: the others wait, then find the session or the refusal the first one left. A lock older
 * than two minutes belongs to a run that died and is taken over.
 */
export async function withLock<T>(account: Account, name: string, work: () => Promise<T>): Promise<T> {
  const file = stateFile(account, `${name}.lock`).replace(/\.json$/, "");
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.closeSync(fs.openSync(file, "wx"));
      break;
    } catch {
      const age = fs.existsSync(file) ? Date.now() - fs.statSync(file).mtimeMs : 0;
      if (age > LOCK_STALE_MS) fs.rmSync(file, { force: true });
      else if (Date.now() > deadline) throw new Error(`Waited ${LOCK_WAIT_MS / 1000} s for another worker to sign in ${who(account).toLowerCase()} — remove ${path.relative(process.cwd(), file)} if no run is going on`);
      else await new Promise((done) => setTimeout(done, 300));
    }
  }
  try {
    return await work();
  } finally {
    fs.rmSync(file, { force: true });
  }
}
