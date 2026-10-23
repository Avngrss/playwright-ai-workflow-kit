import fs from "node:fs";
import { request, type Browser, type Page } from "@playwright/test";
import { authConfig, requireRole, resolve, who, type Account, type ApiMode } from "./auth-config";
import { formLogin, signInOnPage, type StorageState } from "./form-login";
import { clearRefused, forgetState, markRefused, readState, stateFile, throwIfPaused, withLock, writeState } from "./state";
import { cookiesFromSession, tokenFromSession } from "./token";

/**
 * Signed-in browser sessions: one sign-in per app and role, shared by all workers and reused across
 * runs (state/) while the server still accepts it; a refused sign-in is never repeated with the same
 * login and password — repeated wrong passwords lock test accounts.
 */

const REUSE_MARGIN_SECONDS = 5 * 60;
// In-process reuse, re-checked on every call: a run longer than a token's life refreshes it.
const sessions = new Map<string, { state: Promise<StorageState>; until: number }>();
const keyOf = ({ platform, role }: Account) => `${platform}/${role}`;

/**
 * A project whose login fits neither universal client provides ./project.ts with the same two
 * functions (`ui: custom` / `api: custom` in the map) — written or ported once, reviewed. The app
 * comes third: the account is always an app's.
 */
interface ProjectLogin {
  browserSession(browser: Browser, role: string, platform: string): Promise<StorageState>;
  apiHeaders(browser: Browser, role: string, platform: string): Promise<Record<string, string>>;
}
export function projectLogin(): ProjectLogin {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./project") as ProjectLogin;
  } catch {
    throw new Error('specs/project-map.md §Auth says "custom" but src/setup/auth/project.ts is missing — the auth setup step writes it');
  }
}

/**
 * Seconds a JWT may still be reused: until it expires, less a margin — 5 minutes, or a fifth of the life of
 * a shorter token (one living 5 minutes would otherwise never be reused); undefined for a token that is not a JWT.
 */
function secondsLeft(token: string): number | undefined {
  try {
    const { exp, iat } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { exp?: number; iat?: number };
    if (!exp) return undefined;
    const margin = iat ? Math.min(REUSE_MARGIN_SECONDS, Math.floor((exp - iat) / 5)) : REUSE_MARGIN_SECONDS;
    return exp - margin - Math.floor(Date.now() / 1000);
  } catch {
    return undefined;
  }
}

/** Until when credentials may be reused: a JWT's expiry less the margin, otherwise the session max age. */
export function usableUntil(token: string | undefined, platform: string): number {
  const left = token ? secondsLeft(token) : undefined;
  return left !== undefined ? Date.now() + left * 1000 : Date.now() + authConfig(platform).sessionMaxAgeMinutes * 60_000;
}

const JWT = /eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/;

/**
 * The JWT a saved session lives by: the map's `session token:`, else the first one the app keeps in its
 * storage or cookies — an app whose API signs in on its own (`login-request`) still keeps its browser token there.
 */
function lifeToken(state: StorageState, platform: string): string | undefined {
  const named = sessionToken(state, platform);
  if (named) return named;
  const kept = [...(state.origins ?? []).flatMap((origin) => origin.localStorage.map((entry) => entry.value)), ...(state.cookies ?? []).map((cookie) => cookie.value)];
  return kept.map((value) => JWT.exec(value)?.[0]).find((token) => token !== undefined && secondsLeft(token) !== undefined);
}

/** The token the signed-in app keeps, when the map says where (`session token:`). */
function sessionToken(state: StorageState, platform: string): string | undefined {
  if (!authConfig(platform).api.sessionToken) return undefined;
  try {
    return tokenFromSession(state, platform);
  } catch {
    return undefined;
  }
}

// API modes whose credentials are the browser session's own (its token or its cookies) — only such a
// session can be checked through the API; with a separate token or key the API would refuse any session.
const SESSION_MODES: ApiMode[] = ["session-token", "session-cookies", "refresh-token"];

/** The server still accepts the session — a redeploy, a changed password or a revoke kills it early. */
async function stillAccepted(state: StorageState, platform: string): Promise<boolean> {
  const { sessionCheck, api } = authConfig(platform);
  if (!sessionCheck || !SESSION_MODES.includes(api.mode)) return true;
  const token = sessionToken(state, platform);
  const context = await request.newContext({ ignoreHTTPSErrors: true });
  try {
    const url = resolve(sessionCheck);
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : { Cookie: cookiesFromSession(state, url) };
    const response = await context.get(url, { headers });
    return response.status() !== 401 && response.status() !== 403;
  } catch {
    return true;
  } finally {
    await context.dispose();
  }
}

async function cachedSession(account: Account): Promise<StorageState | undefined> {
  const { platform } = account;
  const state = readState<StorageState>(account, "session");
  if (!state) return undefined;
  const token = sessionToken(state, platform);
  if (authConfig(platform).api.sessionToken && !token) return undefined; // a cached session without its token is not a session
  const life = lifeToken(state, platform);
  const left = life ? secondsLeft(life) : undefined;
  const age = Date.now() - fs.statSync(stateFile(account, "session")).mtimeMs;
  const fresh = left !== undefined ? left > 0 : age < authConfig(platform).sessionMaxAgeMinutes * 60_000;
  return fresh && (await stillAccepted(state, platform)) ? state : undefined;
}

/** One worker signs the account in; the others wait for it and take the session it saved, or its refusal. */
function login(browser: Browser, account: Account): Promise<StorageState> {
  return withLock(account, "login", async () => {
    throwIfPaused(account);
    const signedInMeanwhile = await cachedSession(account);
    if (signedInMeanwhile) return signedInMeanwhile;
    try {
      const state =
        authConfig(account.platform).ui.mode === "custom"
          ? await projectLogin().browserSession(browser, account.role, account.platform)
          : await formLogin(browser, account);
      clearRefused(account);
      writeState(account, "session", state);
      return state;
    } catch (error) {
      // Only a refused login (the steps ran, the app did not let the account in) pauses further attempts —
      // a network error or a slow stand must not stop the account's sign-in.
      if ((error as Error).message.includes("did not get signed in")) markRefused(account, (error as Error).message);
      throw error;
    }
  });
}

export async function browserSession(browser: Browser, account: Account): Promise<StorageState> {
  requireRole(account);
  if (authConfig(account.platform).ui.mode === "none") throw new Error("specs/project-map.md §Auth has no UI login (ui: none) — this account cannot open the app signed in");
  const held = sessions.get(keyOf(account));
  if (held && Date.now() < held.until) return held.state;
  const state = (async () => (await cachedSession(account)) ?? (await login(browser, account)))();
  sessions.set(keyOf(account), { state, until: Number.POSITIVE_INFINITY });
  state.then(
    (session) => sessions.set(keyOf(account), { state, until: usableUntil(lifeToken(session, account.platform), account.platform) }),
    () => sessions.delete(keyOf(account)),
  );
  return state;
}

/** Drops the account's browser session here and on disk, so the next browserSession signs in anew. */
export function forgetSession(account: Account): void {
  sessions.delete(keyOf(account));
  forgetState(account, "session");
}

/** A sign-in that is not the shared one: it never repeats refused credentials, and a refusal pauses the account like any other. */
async function guarded<T>(account: Account, signIn: () => Promise<T>): Promise<T> {
  throwIfPaused(account);
  try {
    const result = await signIn();
    clearRefused(account);
    return result;
  } catch (error) {
    if ((error as Error).message.includes("did not get signed in")) markRefused(account, (error as Error).message);
    throw error;
  }
}

const formOnly = (account: Account, what: string): void => {
  requireRole(account);
  const { mode } = authConfig(account.platform).ui;
  if (mode !== "form") throw new Error(`${who(account)} signs in ${mode === "none" ? "with no web UI" : "with the project's own login code"} (ui: ${mode}) — ${what} runs the map's form steps only`);
};

/**
 * A session of the test's own (`test.use({ session: "own" })`): a fresh sign-in, neither taken from
 * nor saved to the shared one — signing out, changing the password or ending sessions in it leaves
 * every other test signed in. One extra browser sign-in per such test.
 */
export async function ownSession(browser: Browser, account: Account): Promise<StorageState> {
  formOnly(account, "a session of its own");
  return guarded(account, () => formLogin(browser, account));
}

/** Signs in on the test's own page — the `signIn` fixture of a test that starts signed out. */
export async function signInHere(page: Page, account: Account): Promise<void> {
  formOnly(account, "signing in as a test step");
  await guarded(account, () => signInOnPage(page, account));
}
