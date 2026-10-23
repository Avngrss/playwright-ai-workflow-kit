import { readMapBlock } from "../map-block";
import { defaultPlatform, isMultiPlatform, platformOf } from "../platforms";

/**
 * How an app logs in — its ```auth block in specs/project-map.md §Auth, written once by the setup
 * skill's sign-in step, one per app (`platform: <app>`; an old block without it serves an app that
 * has none of its own). Product knowledge lives there; this code is the same for
 * every project. No block yet = login not set up: tests run signed out, asking for a role fails clearly.
 */

/** Who signs in: a role of one app — that app's ```auth block decides how. */
export interface Account {
  platform: string;
  role: string;
}
export type FormStep =
  | { action: "fill"; target: string; value: "login" | "password" }
  | { action: "click"; target: string }
  | { action: "wait"; target: string };

/**
 * Where API tests get their credentials (.cursor/skills/setup/SKILL.md):
 *   token           a token endpoint, fields from the map (a public client's password grant needs no secret)
 *   refresh-token   one browser sign-in, then new tokens over HTTP with its refresh token
 *   session-token   the token the signed-in app keeps in the browser
 *   session-cookies the signed-in browser's cookies
 *   login-request   the app's own sign-in request (no OAuth) → a cookie or a token
 *   key / basic     an API key header / HTTP Basic with the account's login and password
 *   custom / none   the project's own client / no credentials
 */
export type ApiMode = "token" | "refresh-token" | "session-token" | "session-cookies" | "login-request" | "key" | "basic" | "custom" | "none";
const API_MODES: ApiMode[] = ["token", "refresh-token", "session-token", "session-cookies", "login-request", "key", "basic", "custom"];

/** A value the signed-in app keeps in its storage: `localStorage oidc.user:* access_token`. */
export interface StorageField {
  storage: "localStorage" | "sessionStorage";
  key: string;
  field: string;
}
const storageField = (text: string | undefined): StorageField | undefined => {
  const match = /^(localStorage|sessionStorage) (\S+) (\S+)$/.exec(text ?? "");
  return match ? { storage: match[1] as StorageField["storage"], key: match[2], field: match[3] } : undefined;
};
// One field per line, so a value with spaces (an OAuth scope list) stays whole.
const pairs = (lines: string[] | undefined): Array<[string, string]> =>
  (lines ?? []).map((pair) => [pair.slice(0, pair.indexOf("=")).trim(), pair.slice(pair.indexOf("=") + 1).trim()]);

/** A further account's own lines (`login member: ${APP_MEMBER_LOGIN}`) — the first account's stay as they are. */
export type AccountLines = Partial<Record<"login" | "password" | "key", string>>;

export interface AuthConfig {
  configured: boolean;
  roles: string[];
  /** Roles with sign-in values of their own, by role. */
  accounts: Record<string, AccountLines>;
  defaultRole: string;
  /** `membersOnly`: an app open to visitors names a page only a signed-in user may open (`members only:`). */
  ui: { mode: "form" | "custom" | "none"; start: string; steps: FormStep[]; signedIn: { url?: string; text?: string }; membersOnly?: string; login: string; password: string };
  api: {
    mode: ApiMode;
    sessionToken?: StorageField;
    refreshToken?: StorageField;
    tokenUrl?: string;
    tokenFields: Array<[string, string]>;
    loginUrl?: string;
    loginBody: Array<[string, string]>;
    loginFormat: "json" | "form";
    sessionFrom: { cookie: true } | { cookie: false; jsonField: string };
    keyHeader: string;
    key?: string;
    keyPrefix?: string;
  };
  sessionCheck?: string;
  sessionMaxAgeMinutes: number;
}


function parseStep(text: string): FormStep {
  const fill = /^fill (?:"([^"]+)"|(password)) with (login|password)$/.exec(text);
  if (fill) return { action: "fill", target: fill[1] ?? "password", value: fill[3] as "login" | "password" };
  const click = /^click "([^"]+)"$/.exec(text);
  if (click) return { action: "click", target: click[1] };
  const wait = /^wait for "([^"]+)"$/.exec(text);
  if (wait) return { action: "wait", target: wait[1] };
  throw new Error(
    `Unknown login step "${text}" in specs/project-map.md §Auth — use: fill "<field>" with login|password · fill password with password · click "<button>" · wait for "<text>"`,
  );
}

const cache = new Map<string, AuthConfig>();

/** The one role of an app whose block lists no roles — a single test account. */
export const SINGLE_ACCOUNT = "user";

/**
 * The accounts the sign-in smoke checks. The smoke asks "is the stand alive?", and every other test
 * of the app waits for it — so it checks the first account only: a further role's broken password
 * must not stop the whole app. `npm run auth:sign-in -- <app> <role|all>` checks the others (it
 * sets AQA_SIGN_IN=<app>:<role|all>) — when login is set up, a role is added, or a role's session
 * is needed to explore with.
 */
export function signInRoles(platform: string, roles: string[]): string[] {
  const [app, asked] = (process.env.AQA_SIGN_IN ?? "").split(":");
  if (app !== platform || !asked) return roles.slice(0, 1);
  if (asked === "all") return roles;
  const named = roles.filter((role) => role === asked || (asked === SINGLE_ACCOUNT && roles.length === 1));
  if (!named.length) throw new Error(`npm run auth:sign-in: ${platform} has no role "${asked}" — its roles: ${roles.join(", ")} (specs/project-map.md §Auth)`);
  return named;
}

/** How messages name an account: "The test account" (or "The test client" for an API-only app) when the app has no roles; the app too when the map lists several. */
export function who({ platform, role }: Account): string {
  const config = authConfig(platform);
  const app = isMultiPlatform() ? ` of ${platform}` : "";
  if (role !== SINGLE_ACCOUNT || config.roles.length !== 1) return `Role "${role}"${app}`;
  return `${config.ui.mode === "none" ? "The test client" : "The test account"}${app}`;
}

// Lines read as `name = value` pairs — a block signing in like another app replaces them field by field.
const PAIR_KEYS = new Set(["token field", "login body"]);
const fieldOf = (pair: string) => pair.slice(0, pair.indexOf("=")).trim();

/**
 * The app's ```auth block. `sign-in like: <app>` takes that app's block and replaces only what this
 * one writes — its address, its signed-in sign, its client id, or its own login and password when
 * the shared account is not let in — so a sign-in several apps share lives in one place.
 */
function signInBlock(platform: string, seen: string[] = []): Map<string, string[]> | undefined {
  const own = readMapBlock("auth", platform);
  const like = own?.get("sign-in like")?.[0];
  if (!own || !like) return own;
  if (like === platform || seen.includes(like)) {
    throw new Error(`specs/project-map.md §Auth: "sign-in like:" goes round in a circle (${[...seen, platform, like].join(" → ")})`);
  }
  const base = signInBlock(like, [...seen, platform]);
  if (!base) throw new Error(`specs/project-map.md §Auth: ${platform} signs in like "${like}", which has no auth block of its own`);
  const merged = new Map(base);
  merged.delete("platform");
  for (const [key, values] of own) {
    if (key === "sign-in like") continue;
    if (!PAIR_KEYS.has(key)) {
      merged.set(key, values);
      continue;
    }
    const replaced = new Set(values.map(fieldOf));
    merged.set(key, [...(merged.get(key) ?? []).filter((pair) => !replaced.has(fieldOf(pair))), ...values]);
  }
  return merged;
}

export function authConfig(platform: string = defaultPlatform()): AuthConfig {
  const known = cache.get(platform);
  if (known) return known;
  const entries = signInBlock(platform);
  const one = (key: string) => entries?.get(key)?.[0];
  const listed = (one("roles") ?? "").split(",").map((role) => role.trim()).filter(Boolean);
  const signsIn = [one("ui"), one("api")].some((mode) => mode !== undefined && mode !== "none");
  // A further account adds lines of its own (`login member:`, `password member:`, `key member:`); the role
  // they name is listed by them, and the first account's lines and .env names never change. The sign-in
  // request's and the key's own lines (`login url:`, `key header:`, …) name no role.
  const accounts: Record<string, AccountLines> = {};
  for (const [key, values] of entries ?? []) {
    const own = /^(login|password|key) (?!(?:url|body|format|header|prefix)$)([a-z0-9-]+)$/.exec(key);
    if (own) accounts[own[2]] = { ...accounts[own[2]], [own[1]]: values[0] };
  }
  // Roles are optional: a login with no roles: line is one test account (its .env names have no <ROLE>).
  const base = listed.length ? listed : signsIn ? [SINGLE_ACCOUNT] : [];
  const roles = [...base, ...Object.keys(accounts).filter((role) => !base.includes(role))];
  const signedIn = one("signed in when") ?? "";
  const sessionFrom = one("session from") ?? "cookie";
  const config: AuthConfig = {
    configured: entries !== undefined,
    roles,
    accounts,
    defaultRole: one("default role") ?? roles[0] ?? "none",
    ui: {
      mode: (["form", "custom"].includes(one("ui") ?? "") ? one("ui") : "none") as AuthConfig["ui"]["mode"],
      // No `start:` line → the app's own web address (its UI row's .env name), never a bare "/".
      start: one("start") ?? (platformOf(platform).ui ? `\${${platformOf(platform).ui}}` : "/"),
      steps: (entries?.get("step") ?? []).map(parseStep),
      signedIn: {
        url: /^url starts with (.+)$/.exec(signedIn)?.[1],
        text: /^text "([^"]+)"$/.exec(signedIn)?.[1],
      },
      membersOnly: one("members only"),
      login: one("login") ?? "",
      password: one("password") ?? "",
    },
    api: {
      mode: (API_MODES as string[]).includes(one("api") ?? "") ? (one("api") as ApiMode) : "none",
      sessionToken: storageField(one("session token")),
      refreshToken: storageField(one("refresh token")),
      tokenUrl: one("token url"),
      tokenFields: pairs(entries?.get("token field")),
      loginUrl: one("login url"),
      loginBody: pairs(entries?.get("login body")),
      loginFormat: one("login format") === "form" ? "form" : "json",
      sessionFrom: sessionFrom.startsWith("json ") ? { cookie: false, jsonField: sessionFrom.slice(5).trim() } : { cookie: true },
      keyHeader: one("key header") ?? "X-Api-Key",
      key: one("key"),
      keyPrefix: one("key prefix"),
    },
    sessionCheck: one("session check"),
    sessionMaxAgeMinutes: Number(one("session max age") ?? 30),
  };
  cache.set(platform, config);
  return config;
}

/** The account, if the app's block lists its role — otherwise a readable error (login not set up / unknown role). */
export function requireRole(account: Account): Account {
  const { platform, role } = account;
  const config = authConfig(platform);
  const block = isMultiPlatform() ? `specs/project-map.md §Auth (the block with platform: ${platform})` : "specs/project-map.md §Auth";
  if (!config.configured) {
    const app = isMultiPlatform() ? ` for ${platform}` : " for this project";
    throw new Error(`Login is not set up${app} yet — run the setup skill (/setup); it sets up how tests log in (${block})`);
  }
  if (!config.roles.includes(role)) {
    if (config.roles.length === 1 && config.roles[0] === SINGLE_ACCOUNT) {
      throw new Error(`Role "${role}" — this app signs in with one test account; another account is added to ${block} with lines of its own: login ${role}: \${<APP>_${envForm(role)}_LOGIN}, password ${role}: \${<APP>_${envForm(role)}_PASSWORD}`);
    }
    throw new Error(`Role "${role}" is not listed in ${block} (roles: ${config.roles.join(", ") || "none"})`);
  }
  return account;
}

const envForm = (role: string) => role.toUpperCase().replace(/-/g, "_");

/** The `.env` names a template needs for a role (`${APP_<ROLE>_PASSWORD}` → `APP_MANAGER_PASSWORD`). */
export function envNames(template: string, role?: string): string[] {
  const withRole = role ? template.replace(/<ROLE>/g, envForm(role)) : template;
  return [...withRole.matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((match) => match[1]);
}

/**
 * Templates with `${NAME}` and `<ROLE>` → values from `.env`. Every variable still missing is named
 * at once ("Role manager needs APP_MANAGER_USERNAME, APP_MANAGER_PASSWORD in .env").
 */
export function resolveAll(templates: string[], account?: Account): string[] {
  const role = account?.role;
  templates = account ? templates.map((template) => forAccount(template, account)) : templates;
  const missing = [...new Set(templates.flatMap((template) => envNames(template, role)))].filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`${account ? who(account) : "Login"} needs ${missing.join(", ")} in .env (names from specs/project-map.md §Auth)`);
  }
  return templates.map((template) =>
    (role ? template.replace(/<ROLE>/g, envForm(role)) : template).replace(/\$\{([A-Z0-9_]+)\}/g, (_, name: string) => process.env[name] as string),
  );
}

export const resolve = (template: string, account?: Account): string => resolveAll([template], account)[0];

/**
 * A template as a role with an account of its own reads it: the first account's login, password or
 * key (`${APP_LOGIN}`) becomes the role's (`${APP_MEMBER_LOGIN}`) — in the form, the token request's
 * fields and the sign-in request's body alike.
 */
export function forAccount(template: string, account: Account): string {
  const config = authConfig(account.platform);
  const own = config.accounts[account.role];
  if (!own) return template;
  const first: AccountLines = { login: config.ui.login, password: config.ui.password, key: config.api.key };
  let result = template;
  for (const field of ["login", "password", "key"] as const) {
    const from = first[field];
    const to = own[field];
    if (from && to) result = result.split(from).join(to);
  }
  return result;
}
