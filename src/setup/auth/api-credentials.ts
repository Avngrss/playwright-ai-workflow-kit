import { createHash } from "node:crypto";
import type { Browser } from "@playwright/test";
import { authConfig, envNames, requireRole, type Account, type ApiMode } from "./auth-config";
import { browserSession, forgetSession, projectLogin, usableUntil } from "./browser-session";
import { urlOf } from "../platforms";
import { clearRefused, forgetState, markRefused, readState, throwIfPaused, withLock, writeState } from "./state";
import {
  basicHeaders,
  CredentialsRefused,
  ServerRefused,
  cookiesFromSession,
  headersFromLoginRequest,
  keyHeaders,
  refreshTokenFromSession,
  tokenFromEndpoint,
  tokenFromSession,
} from "./token";

/**
 * The headers API requests send, made the way the app's `api:` line says (.cursor/skills/setup/SKILL.md
 * of the kit's skills). A browser is opened only by the modes that sign in through one — the caller
 * passes how to get it, so a token, a key or a refresh token never starts a browser.
 */

type BrowserOnDemand = () => Promise<Browser>;

// In-process reuse, re-checked on every call: a run longer than a token's life refreshes it.
const heldApiHeaders = new Map<string, { headers: Promise<Record<string, string>>; until: number }>();
const keyOf = ({ platform, role }: Account) => `${platform}/${role}`;

interface SavedApiHeaders {
  mode: ApiMode;
  settings: string;
  headers?: Record<string, string>;
  refusal?: string;
  until: number;
}

const REFUSAL_KEPT_MS = 10 * 60 * 1000;

/**
 * A fingerprint of what the API credentials are made from — the app's api lines and the .env values
 * they name (hashed, never stored) — so a saved token or refusal is dropped as soon as either changes.
 */
function apiSettings({ platform, role }: Account): string {
  const { api } = authConfig(platform);
  const names = envNames(JSON.stringify(api), role);
  return createHash("sha256").update(JSON.stringify([api, names.map((name) => process.env[name] ?? "")])).digest("hex");
}

/**
 * API headers made once and shared — in this process, with the other workers and with the next run
 * (state/, until shortly before they expire) — and made under the account's lock, so parallel
 * workers ask the server once. A refusal of the account's credentials pauses it, like a refused
 * browser sign-in; any refusal is kept for the rest of this process instead of being asked again per test.
 */
function sharedApiHeaders(account: Account, make: () => Promise<Record<string, string>>): Promise<Record<string, string>> {
  const held = heldApiHeaders.get(keyOf(account));
  if (held && Date.now() < held.until) return held.headers;
  const { mode } = authConfig(account.platform).api;
  const settings = apiSettings(account);
  const saved = withLock(account, "api", async (): Promise<SavedApiHeaders> => {
    const previous = readState<SavedApiHeaders>(account, "api");
    if (previous && previous.mode === mode && previous.settings === settings && Date.now() < previous.until) {
      if (previous.refusal) throw new Error(previous.refusal); // another worker already heard this "no"
      return previous;
    }
    throwIfPaused(account);
    try {
      const headers = await make();
      const bearer = /^Bearer (.+)$/.exec(headers.Authorization ?? "")?.[1];
      const fresh = { mode, settings, headers, until: usableUntil(bearer, account.platform) };
      clearRefused(account);
      writeState(account, "api", fresh);
      return fresh;
    } catch (error) {
      if (error instanceof CredentialsRefused) markRefused(account, error.message);
      if (error instanceof ServerRefused) writeState(account, "api", { mode, settings, refusal: error.message, until: Date.now() + REFUSAL_KEPT_MS });
      throw error;
    }
  });
  const headers = saved.then((entry) => entry.headers as Record<string, string>);
  heldApiHeaders.set(keyOf(account), { headers, until: Number.POSITIVE_INFINITY });
  saved.then(
    (entry) => heldApiHeaders.set(keyOf(account), { headers, until: entry.until }),
    () => undefined,
  );
  return headers;
}

/**
 * `api: refresh-token` — a browser signs in once; its refresh token then buys new access tokens over
 * HTTP, run after run, until it expires. The latest refresh token is kept (servers rotate them); an
 * expired one means one more browser sign-in.
 */
async function headersFromRefreshToken(browser: BrowserOnDemand, account: Account): Promise<Record<string, string>> {
  const exchange = async (refreshToken: string) => {
    const answer = await tokenFromEndpoint(account, { grant_type: "refresh_token", refresh_token: refreshToken });
    writeState(account, "refresh", { refreshToken: answer.refreshToken ?? refreshToken });
    return { Authorization: `Bearer ${answer.accessToken}` };
  };
  const fromBrowser = async () => exchange(refreshTokenFromSession(await browserSession(await browser(), account), account.platform));
  const saved = readState<{ refreshToken: string }>(account, "refresh")?.refreshToken;
  try {
    return saved ? await exchange(saved) : await fromBrowser();
  } catch (error) {
    if (!(error as Error).message.includes("invalid_grant")) throw error;
    forgetState(account, "refresh");
    forgetSession(account);
    return fromBrowser();
  }
}

export async function apiHeaders(browser: BrowserOnDemand, account: Account): Promise<Record<string, string>> {
  const { api } = authConfig(account.platform);
  switch (api.mode) {
    case "none":
      return {};
    case "custom":
      requireRole(account);
      return projectLogin().apiHeaders(await browser(), account.role, account.platform);
    case "key":
      return keyHeaders(account);
    case "basic":
      return basicHeaders(account);
    case "token":
      return sharedApiHeaders(account, async () => ({ Authorization: `Bearer ${(await tokenFromEndpoint(account)).accessToken}` }));
    case "refresh-token":
      return sharedApiHeaders(account, () => headersFromRefreshToken(browser, account));
    case "login-request":
      return sharedApiHeaders(account, () => headersFromLoginRequest(account));
    default: {
      const state = await browserSession(await browser(), account);
      return api.mode === "session-token" ? { Authorization: `Bearer ${tokenFromSession(state, account.platform)}` } : { Cookie: cookiesFromSession(state, urlOf(account.platform, "api")) };
    }
  }
}
