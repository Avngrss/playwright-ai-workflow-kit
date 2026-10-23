import { request } from "@playwright/test";
import { authConfig, resolve, resolveAll, who, type Account, type StorageField } from "./auth-config";
import type { StorageState } from "./form-login";

/**
 * How API tests get their credentials without a project-specific client — every mode of the map's
 * `api:` line except `session-cookies` (the browser's cookies) and `custom`.
 */

/** A sign-in the server refused because of the account's credentials — the caller pauses further attempts. */
export class CredentialsRefused extends Error {}

/** A definite "no" from the server about the configuration (a client, a grant, a scope) — asking again cannot help. */
export class ServerRefused extends Error {}

/** The value the signed-in app keeps in its storage (`localStorage oidc.user:* access_token`). */
function fromSession(state: StorageState, config: StorageField, line: string): string {
  const pattern = new RegExp(`^${config.key.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
  const entry = state.origins.flatMap((origin) => origin.localStorage).find((item) => pattern.test(item.name));
  if (!entry) throw new Error(`No "${config.key}" entry in the session's storage — the login did not finish (is the user signed in?)`);
  const value = (JSON.parse(entry.value) as Record<string, unknown>)[config.field];
  if (typeof value !== "string") throw new Error(`The "${config.key}" entry has no "${config.field}" (specs/project-map.md §Auth, "${line}:")`);
  return value;
}

export function tokenFromSession(state: StorageState, platform: string): string {
  const config = authConfig(platform).api.sessionToken;
  if (!config) throw new Error('specs/project-map.md §Auth needs a "session token:" line (where the signed-in app keeps its token)');
  return fromSession(state, config, "session token");
}

export function refreshTokenFromSession(state: StorageState, platform: string): string {
  const config = authConfig(platform).api.refreshToken;
  if (!config) throw new Error('specs/project-map.md §Auth: "api: refresh-token" needs a "refresh token:" line');
  return fromSession(state, config, "refresh token");
}

/**
 * The session's cookies as one Cookie header — for apps that keep no token in the browser. With the
 * address it goes to, only the cookies a browser would send there: an identity provider's cookies of the
 * same name would otherwise reach the API too. None of them for that host → all, as before.
 */
export function cookiesFromSession(state: StorageState, to?: string): string {
  const host = to ? new URL(to).hostname : undefined;
  const sent = (domain: string) => !host || host === domain.replace(/^\./, "") || (domain.startsWith(".") && host.endsWith(domain));
  const cookies = state.cookies.filter((cookie) => sent(cookie.domain));
  return (cookies.length ? cookies : state.cookies).map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

/** What an OAuth error code means for the person fixing it (RFC 6749 §5.2). */
const TOKEN_ERRORS: Record<string, string> = {
  invalid_client: "The client id or client secret is wrong — check them in .env",
  unauthorized_client: "This client may not get tokens this way — the auth setup step picks another source",
  invalid_grant: "The login or password is wrong, the account is locked, or the refresh token expired — check .env",
  invalid_scope: "A requested scope is not allowed for this client — check the scope token field",
  unsupported_grant_type: "The identity provider does not allow this grant — the auth setup step picks another source",
};

export interface TokenAnswer {
  accessToken: string;
  refreshToken?: string;
}

/**
 * A token from the identity provider's token endpoint: the map's `token field:` lines (values from
 * .env), plus `extra` (a refresh token's grant). A refusal over the account's own credentials
 * (`invalid_grant` on a password grant) is a CredentialsRefused.
 */
export async function tokenFromEndpoint(account: Account, extra: Record<string, string> = {}): Promise<TokenAnswer> {
  const { api, ui } = authConfig(account.platform);
  if (!api.tokenUrl || api.tokenFields.length === 0) {
    throw new Error('specs/project-map.md §Auth needs "token url:" and "token field:" lines for this API mode');
  }
  const form = { ...Object.fromEntries(api.tokenFields.map(([name, value]) => [name, resolve(value, account)])), ...extra };
  const context = await request.newContext({ ignoreHTTPSErrors: true });
  try {
    const response = await context.post(resolve(api.tokenUrl, account), { form });
    const body = (await response.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
    if (body.access_token) return { accessToken: body.access_token, refreshToken: body.refresh_token };
    const reason = [body.error, body.error_description].filter(Boolean).join(": ") || "no access_token in the answer";
    const message =
      `${who(account)} got no token from the token endpoint — ${response.status()} ${reason}. ` +
      (TOKEN_ERRORS[body.error ?? ""] ?? "Check the token fields in specs/project-map.md §Auth and their values in .env") +
      (ui.mode === "none" ? "" : ". UI tests are not affected");
    if (body.error === "invalid_grant" && form.grant_type === "password") throw new CredentialsRefused(message);
    throw body.error && body.error !== "invalid_grant" ? new ServerRefused(message) : new Error(message);
  } finally {
    await context.dispose();
  }
}

/** The app's own sign-in request (`login url:` + `login body:` lines) → a Cookie or a bearer header. */
export async function headersFromLoginRequest(account: Account): Promise<Record<string, string>> {
  const { api } = authConfig(account.platform);
  if (!api.loginUrl || api.loginBody.length === 0) {
    throw new Error('specs/project-map.md §Auth: "api: login-request" needs "login url:" and "login body:" lines');
  }
  const body = Object.fromEntries(api.loginBody.map(([name, value]) => [name, resolve(value, account)]));
  const context = await request.newContext({ ignoreHTTPSErrors: true });
  try {
    const url = resolve(api.loginUrl, account);
    const response = await context.post(url, api.loginFormat === "form" ? { form: body } : { data: body });
    if (response.status() === 400 || response.status() === 401 || response.status() === 403) {
      throw new CredentialsRefused(`${who(account)} was not signed in by ${new URL(url).pathname} — ${response.status()}. Check its login and password in .env`);
    }
    if (!response.ok()) throw new Error(`${new URL(url).pathname} answered ${response.status()} to the sign-in request`);
    if (api.sessionFrom.cookie) {
      const cookies = (await context.storageState()).cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
      if (!cookies) throw new Error(`${new URL(url).pathname} signed ${who(account).toLowerCase()} in but set no cookie — "session from:" should name the token in the answer`);
      return { Cookie: cookies };
    }
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const token = api.sessionFrom.jsonField.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], json);
    if (typeof token !== "string") throw new Error(`The sign-in answer has no "${api.sessionFrom.jsonField}" — check "session from:" in specs/project-map.md §Auth`);
    return { Authorization: `Bearer ${token}` };
  } finally {
    await context.dispose();
  }
}

/** `api: key` — one header with a key from .env (`key header:`, `key:`, optional `key prefix:`). */
export function keyHeaders(account: Account): Record<string, string> {
  const { api } = authConfig(account.platform);
  if (!api.key) throw new Error('specs/project-map.md §Auth: "api: key" needs a "key:" line naming the .env variable');
  const key = resolve(api.key, account);
  return { [api.keyHeader]: api.keyPrefix ? `${api.keyPrefix} ${key}` : key };
}

/** `api: basic` — HTTP Basic with the account's `login:` and `password:` from .env. */
export function basicHeaders(account: Account): Record<string, string> {
  const { ui } = authConfig(account.platform);
  const [login, password] = resolveAll([ui.login, ui.password], account);
  return { Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}` };
}
