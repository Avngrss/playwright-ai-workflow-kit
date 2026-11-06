import { chromium, request, type APIRequestContext, type Browser, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import { maskSecrets } from "../reporting/readable-error";
import { apiHeaders } from "./auth/auth";
import { authConfig, requireRole } from "./auth/auth-config";
import { missingUrl, urlOf } from "./platforms";

/**
 * The search behind `npm run stand:find` (scripts/agent/stand-find.mjs — its header is the manual).
 * stand-find.config.ts runs it as its only global setup — no test, no sweep, no report — so every
 * account signs in exactly as the tests do (./auth/: saved sessions, a refused sign-in never tried
 * again). It takes the checked call from AQA_STAND_FIND, sends GET requests only and writes what it
 * found to the file the call names: the stand is never changed.
 */

/** One step of a field path: a field's name, and whether `[]` walks the list it holds. */
interface Step {
  key: string;
  each: boolean;
}
type FieldPath = Step[];

interface Condition {
  path: FieldPath;
  op: "=" | "~" | ">=" | "<=" | ">" | "<";
  value: string;
}

interface Call {
  app: string;
  /** A GET path of the app's API, `{tenant}` where each tenant's id goes. */
  path: string;
  /** How the app lists an account's tenants (the map's `tenants:` line): the list in the answer, each entry's id and name. */
  tenants?: { path: string; list: FieldPath; id: FieldPath; name?: FieldPath };
  /** The accounts asked for; none = every account of the app. */
  accounts: string[];
  conditions: Condition[];
  /** Where the findings are written (JSON). */
  result: string;
}

interface Tenant {
  id: string;
  name?: string;
}

/** One place searched — an account, in one of its tenants — or why it could not be. */
interface Place {
  account: string;
  tenant?: Tenant;
  items?: number;
  matches?: number;
  ids?: string[];
  error?: string;
}

const FIRST_IDS = 5;

const firstLine = (error: unknown): string => maskSecrets((error instanceof Error ? error.message : String(error)).split("\n")[0]);

/** A field of a value — its own, never one it inherits; a list's or a text's `length` too. */
const field = (value: unknown, key: string): unknown =>
  value !== null && value !== undefined && Object.hasOwn(Object(value), key) ? (Object(value) as Record<string, unknown>)[key] : undefined;

/** Every value a path reaches: `[]` walks each entry of a list, so one path may reach many. */
function valuesAt(value: unknown, path: FieldPath): unknown[] {
  let reached = [value];
  for (const { key, each } of path) {
    reached = reached.flatMap((current) => {
      const next = field(current, key);
      if (each) return Array.isArray(next) ? next : [];
      return next === undefined ? [] : [next];
    });
  }
  return reached;
}

const asText = (value: unknown): string => (typeof value === "string" ? value : value !== null && typeof value === "object" ? JSON.stringify(value) : String(value));

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;
};

/** One value against one condition: `=` the same text, `~` contains it (any case), the others compare numbers. */
function meets(actual: unknown, { op, value }: Condition): boolean {
  if (op === "=") return asText(actual) === value;
  if (op === "~") return asText(actual).toLowerCase().includes(value.toLowerCase());
  const [left, right] = [asNumber(actual), Number(value)];
  if (left === undefined) return false;
  return op === ">=" ? left >= right : op === "<=" ? left <= right : op === ">" ? left > right : left < right;
}

/** The longest start all paths share, cut back to its last list (`[]`) — empty when they share none. */
function sharedList(paths: FieldPath[]): FieldPath {
  if (!paths.length) return [];
  let shared = paths[0].length;
  for (const path of paths.slice(1)) {
    let same = 0;
    while (same < Math.min(shared, path.length) && path[same].key === paths[0][same].key && path[same].each === paths[0][same].each) same += 1;
    shared = same;
  }
  const last = paths[0].slice(0, shared).map((step) => step.each).lastIndexOf(true);
  return paths[0].slice(0, last + 1);
}

/**
 * What the conditions are checked on, so all of them hold for the same item: the entries of an answer
 * that is a list; of an answer object, the entries of the list every condition starts with
 * (`items[].status=Paid && items[].total>=100`); else the answer itself.
 */
function itemsOf(answer: unknown, conditions: Condition[]): { items: unknown[]; conditions: Condition[]; whole: boolean } {
  if (Array.isArray(answer)) return { items: answer, conditions, whole: false };
  const list = sharedList(conditions.map((condition) => condition.path));
  if (!list.length) return { items: [answer], conditions, whole: true };
  return { items: valuesAt(answer, list), conditions: conditions.map((condition) => ({ ...condition, path: condition.path.slice(list.length) })), whole: false };
}

/** How the output names an item: its id, else its name, else the value itself or its place in the list. */
function idOf(item: unknown, index: number, whole: boolean): string {
  if (typeof item === "string" || typeof item === "number") return String(item);
  for (const key of ["id", "name"]) {
    const value = field(item, key);
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return whole ? "the answer" : `#${index + 1}`;
}

function tenantsOf(answer: unknown, line: NonNullable<Call["tenants"]>): Tenant[] {
  const entries = line.list.length ? valuesAt(answer, line.list) : Array.isArray(answer) ? answer : [];
  const found = new Map<string, Tenant>();
  for (const entry of entries) {
    const id = valuesAt(entry, line.id)[0];
    if (id === undefined || id === null || typeof id === "object") continue;
    const name = line.name ? valuesAt(entry, line.name)[0] : undefined;
    found.set(String(id), { id: String(id), name: name === undefined || name === null ? undefined : asText(name) });
  }
  return [...found.values()];
}

async function answerOf(api: APIRequestContext, path: string): Promise<unknown> {
  const response = await api.get(path.replace(/^\/+/, ""));
  if (!response.ok()) throw new Error(`GET ${path} answered ${response.status()}`);
  try {
    return await response.json();
  } catch {
    throw new Error(`GET ${path} answered ${response.status()} with no JSON`);
  }
}

async function searchPlace(api: APIRequestContext, call: Call, account: string, tenant?: Tenant): Promise<Place> {
  const path = tenant ? call.path.split("{tenant}").join(encodeURIComponent(tenant.id)) : call.path;
  try {
    const { items, conditions, whole } = itemsOf(await answerOf(api, path), call.conditions);
    const matching = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => conditions.every((condition) => valuesAt(item, condition.path).some((value) => meets(value, condition))));
    return { account, tenant, items: items.length, matches: matching.length, ids: matching.slice(0, FIRST_IDS).map(({ item, index }) => idOf(item, index, whole)) };
  } catch (error) {
    return { account, tenant, error: `not searched — ${firstLine(error)}` };
  }
}

/** The places of one account (a role; none = signed out): each tenant its listing returns, or the API once. */
async function searchAs(call: Call, base: string, timeout: number, browser: () => Promise<Browser>, role?: string): Promise<Place[]> {
  const account = role ?? "signed out";
  let headers: Record<string, string>;
  try {
    headers = role ? await apiHeaders(browser, requireRole({ platform: call.app, role })) : {};
  } catch (error) {
    return [{ account, error: `not signed in — ${firstLine(error)}` }];
  }
  const api = await request.newContext({ baseURL: `${base.replace(/\/+$/, "")}/`, extraHTTPHeaders: headers, ignoreHTTPSErrors: true, timeout });
  try {
    if (!call.tenants) return [await searchPlace(api, call, account)];
    let listing: unknown;
    try {
      listing = await answerOf(api, call.tenants.path);
    } catch (error) {
      return [{ account, error: `tenants not listed — ${firstLine(error)}` }];
    }
    const tenants = tenantsOf(listing, call.tenants);
    if (!tenants.length) {
      const unnamed = !call.tenants.list.length && !Array.isArray(listing);
      return [{ account, error: `no tenant — GET ${call.tenants.path} lists none for it${unnamed ? " (its answer is no list: the tenants: line names the list it holds, <list>[].id)" : ""}` }];
    }
    const places: Place[] = [];
    for (const tenant of tenants) places.push(await searchPlace(api, call, account, tenant));
    return places;
  } finally {
    await api.dispose();
  }
}

async function search(call: Call, timeout: number): Promise<{ wrongCall?: string; places?: Place[] }> {
  const base = urlOf(call.app, "api");
  if (!base) return { wrongCall: missingUrl(call.app, "api") };
  const { roles } = authConfig(call.app);
  const unknown = call.accounts.filter((account) => !roles.includes(account));
  if (unknown.length) {
    return { wrongCall: `${call.app} has no account ${unknown.join(", ")} — its accounts: ${roles.join(", ") || "none, it is searched signed out"} (specs/project-map.md §Auth)` };
  }
  const accounts = call.accounts.length ? call.accounts : roles;
  let opened: Browser | undefined;
  const browser = async () => (opened ??= await chromium.launch());
  try {
    const places: Place[] = [];
    for (const role of accounts.length ? accounts : [undefined]) places.push(...(await searchAs(call, base, timeout, browser, role)));
    return { places };
  } finally {
    await opened?.close();
  }
}

export default async function standFind(config: FullConfig): Promise<void> {
  const call = JSON.parse(process.env.AQA_STAND_FIND ?? "null") as Call | null;
  if (!call) throw new Error("Run it as npm run stand:find (scripts/agent/stand-find.mjs) — AQA_STAND_FIND names the search");
  const timeout = config.projects[0]?.use.navigationTimeout ?? 15_000;
  let findings: { wrongCall?: string; places?: Place[]; failed?: string };
  try {
    findings = await search(call, timeout);
  } catch (error) {
    findings = { failed: firstLine(error) };
  }
  fs.writeFileSync(call.result, JSON.stringify(findings, null, 2));
}
