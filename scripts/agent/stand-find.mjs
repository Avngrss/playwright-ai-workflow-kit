/**
 * stand:find — searches the stand before a case is written off as Blocked "no such data on the stand":
 * every account of an app (or the named ones) × every tenant (a store, a project, an organisation)
 * each account's own listing returns — one GET per place, sent with that account's API sign-in — and
 * prints where the condition matched: account · tenant (id, name) · matches · the first ids.
 *
 *   npm run stand:find -- <app> --in "GET /api/stores/{tenant}/orders" --where "status=Paid && total>=100"
 *   npm run stand:find -- <app> --in "GET /api/orders?state=open" --where "lines.length>=2" --account manager member
 *
 * --in       `GET <path>` — a path of the app's API (its address comes from .env); `{tenant}` is each
 *            tenant's id. Read-only by construction: any other method is a wrong call.
 * tenants:   one optional line in the app's own ```auth block (specs/project-map.md §Auth) says how the
 *            app lists an account's tenants — `GET <path> → <id>, <name>`, the two being fields of each entry:
 *              tenants: GET /api/stores → id, name                      the answer is the list
 *              tenants: GET /api/account → stores[].id, stores[].name   the list is a field of the answer ([] marks it)
 *            Without it (or without `{tenant}` in --in) the search runs once per account; `{tenant}` without it
 *            is a wrong call.
 * --where    conditions joined with &&, all of them met by the same item:
 *              <path>=<value>       the field reads exactly so, as text (status=Paid, archived=false, closedAt=null)
 *              <path>~<text>        the field contains the text, any case (name~outlet)
 *              <path>>=<n>   <path><=<n>   <path>><n>   <path><<n>     a number compared (total>=100)
 *              <list>.length>=<n>   how many entries a list holds (lines.length>=2), with any of the four
 *            A path is field names joined by dots (customer.city); `[]` after a name walks a list and any
 *            entry may meet the condition (lines[].sku=AB-1). The items: the entries of an answer that is a
 *            list; of an answer object, the entries of the list every condition starts with
 *            (items[].status=Paid && items[].total>=100); else the answer itself. A value may be quoted
 *            ("North Outlet"); && never sits inside one. No code is evaluated. Without --where every item counts.
 * --account  the accounts searched — roles of the app's ```auth block; without it every account. An app that
 *            signs in with none is searched signed out.
 *
 * Each account signs in as the tests do (src/setup/auth/, run through src/setup/stand-find.config.ts —
 * no test, no sweep): a sign-in the server refused before is never tried again — that account is reported, the
 * others searched. Each request times out as a page load does (playwright.config.ts navigationTimeout); a place
 * that fails is reported, never fatal. Nothing is written but this output, test-results/stand-find.json and the
 * sign-in's own state/ files.
 *
 * Exit: 0 found somewhere · 1 found nowhere — every place searched printed, then the `searched:` line a Blocked
 * case's reason ends with · 2 a wrong call (nothing sent), or a search that could not run at all.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { appsOfMap, ensureBrowsers } from "../run-tests.mjs";

const ROOT = process.cwd();
const MAP = path.join(ROOT, "specs", "project-map.md");
const RESULT = path.join(ROOT, "test-results", "stand-find.json");
const CONFIG = path.join(ROOT, "src", "setup", "stand-find.config.ts");
const USAGE = 'npm run stand:find -- <app> --in "GET /api/<…>/{tenant}/<…>" [--where "<condition> && …"] [--account <role>…]';

function wrongCall(message) {
  console.error(`stand:find: ${message}\n  ${USAGE}`);
  process.exit(2);
}

function readArgs(argv) {
  const call = { accounts: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--in" || arg === "--where") {
      if (argv[index + 1] === undefined) wrongCall(`${arg} needs a value`);
      call[arg.slice(2)] = argv[(index += 1)];
    } else if (arg === "--account") {
      const before = call.accounts.length;
      while (argv[index + 1] !== undefined && !argv[index + 1].startsWith("--")) call.accounts.push(...argv[(index += 1)].split(",").map((role) => role.trim()).filter(Boolean));
      if (call.accounts.length === before) wrongCall("--account needs a role");
    } else if (arg.startsWith("--")) wrongCall(`unknown option ${arg}`);
    else if (!call.app) call.app = arg;
    else wrongCall(`"${arg}" — one app only; quote --in and --where`);
  }
  return call;
}

/** `lines[].sku` → [{ key: "lines", each: true }, { key: "sku", each: false }]. */
function fieldPath(text, where) {
  const steps = text.split(".").map((part) => /^([A-Za-z0-9_$-]+)(\[\])?$/.exec(part.trim()));
  if (!text.trim() || steps.some((step) => !step)) wrongCall(`${where}: "${text}" is not a field path — field names joined by dots, [] after a list (lines[].sku)`);
  return steps.map((step) => ({ key: step[1], each: Boolean(step[2]) }));
}

function conditionsOf(where) {
  if (where === undefined) return [];
  return where.split("&&").map((part) => {
    const match = /^([^=~<>]*)(>=|<=|=|~|>|<)(.*)$/s.exec(part.trim());
    if (!match) wrongCall(`--where: "${part.trim()}" is not a condition — <path>=<value>, <path>~<text>, <path>>=<n> (or <=, >, <), <list>.length>=<n>, joined with &&`);
    const [, field, op] = match;
    let value = match[3].trim();
    if (value.length >= 2 && /^(["']).*\1$/s.test(value)) value = value.slice(1, -1);
    if (op === "~" && !value) wrongCall(`--where: "${part.trim()}" — ~ needs the text to look for`);
    if (!["=", "~"].includes(op) && (value === "" || !Number.isFinite(Number(value)))) wrongCall(`--where: "${part.trim()}" — ${op} compares numbers, "${value}" is not one`);
    return { path: fieldPath(field, "--where"), op, value };
  });
}

/** `GET <path>` → the path; any other method, a full address or a placeholder other than {tenant} is a wrong call. */
function getPath(text, where) {
  const match = /^\s*([A-Za-z]+)\s+(\S+)\s*$/.exec(text);
  if (!match) wrongCall(`${where} "${text}" — write the method and a path of the app's API: "GET /api/stores/{tenant}/orders"`);
  const method = match[1].toUpperCase();
  if (method !== "GET") wrongCall(`${where} ${method} — stand:find only reads (GET); it never sends ${method}`);
  const target = match[2];
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//")) wrongCall(`${where} "${target}" is a full address — a path of the app's API, whose address comes from .env`);
  const other = [...target.matchAll(/\{([^}]*)\}/g)].map((found) => found[1]).find((name) => name !== "tenant");
  if (other !== undefined) wrongCall(`${where} {${other}} — only {tenant} is filled in (each tenant's id); write other values out`);
  return target;
}

/**
 * The app's `tenants:` line — its own ```auth block only (the one saying `platform: <app>`, else the one
 * without `platform:`), never a block it signs in like: another app lists other tenants.
 */
function tenantsLine(app) {
  const map = fs.existsSync(MAP) ? fs.readFileSync(MAP, "utf8").replace(/\r\n/g, "\n") : "";
  const blocks = [...map.matchAll(/```auth\n([\s\S]*?)```/g)].map((block) => block[1].split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")));
  const valueOf = (lines, key) => lines.find((line) => new RegExp(`^${key}\\s*:`).test(line))?.replace(/^[^:]*:/, "").trim();
  const own = blocks.find((lines) => valueOf(lines, "platform") === app) ?? blocks.find((lines) => valueOf(lines, "platform") === undefined);
  const text = own && valueOf(own, "tenants");
  if (text === undefined) return undefined;
  const where = `specs/project-map.md, ${app}'s tenants: line`;
  const match = /^(.+?)\s*(?:→|->)\s*([^,]+?)\s*(?:,\s*(.+?))?\s*$/.exec(text);
  if (!match) wrongCall(`${where} "${text}" — write it as tenants: GET /api/<list> → id, name (or → <list>[].id, <list>[].name)`);
  const listPath = getPath(match[1], where);
  if (listPath.includes("{tenant}")) wrongCall(`${where}: the listing itself takes no {tenant}`);
  // The list is what the id's path holds up to its last [] — the name comes from the same entries.
  const split = (steps) => {
    const last = steps.map((step) => step.each).lastIndexOf(true);
    return { list: steps.slice(0, last + 1), field: steps.slice(last + 1) };
  };
  const id = split(fieldPath(match[2], where));
  const name = match[3] === undefined ? undefined : split(fieldPath(match[3], where));
  if (!id.field.length) wrongCall(`${where}: "${match[2]}" names a list — the id is a field of each entry (stores[].id)`);
  if (name && (!name.field.length || JSON.stringify(name.list) !== JSON.stringify(id.list))) wrongCall(`${where}: the name is a field of the same entries as the id (stores[].id, stores[].name)`);
  return { path: listPath, list: id.list, id: id.field, name: name?.field };
}

/** Runs the search through Playwright (stand-find.config.ts) and returns its findings. */
function searchStand(query) {
  fs.mkdirSync(path.dirname(RESULT), { recursive: true });
  fs.rmSync(RESULT, { force: true });
  ensureBrowsers();
  const cli = createRequire(path.join(ROOT, "package.json")).resolve("@playwright/test/cli");
  const run = spawnSync(process.execPath, [cli, "test", "-c", CONFIG, "--pass-with-no-tests"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, AQA_STAND_FIND: JSON.stringify({ ...query, result: RESULT }) },
  });
  if (!fs.existsSync(RESULT)) {
    console.error(`${run.stdout ?? ""}${run.stderr ?? ""}`.trim());
    console.error("stand:find could not run the search — the output above says why");
    process.exit(2);
  }
  const findings = JSON.parse(fs.readFileSync(RESULT, "utf8"));
  if (findings.wrongCall) wrongCall(findings.wrongCall);
  if (findings.failed) {
    console.error(`stand:find stopped — ${findings.failed}`);
    process.exit(2);
  }
  return findings.places;
}

const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const tenantOf = (place) => (place.tenant ? ` · ${place.tenant.id}${place.tenant.name ? ` (${place.tenant.name})` : ""}` : "");

function print(places, searched) {
  const found = places.filter((place) => place.matches > 0);
  const failed = places.filter((place) => place.error);
  const read = places.length - failed.length;
  console.log(`stand:find ${searched}`);
  // Found → the places it is in; found nowhere → every place, so the Blocked line can cite them.
  for (const place of found.length ? [...found, ...failed] : places) {
    const where = `${place.account}${tenantOf(place)}`;
    if (place.error) console.log(`! ${where} · ${place.error}`);
    else if (place.matches) console.log(`✓ ${where} · ${place.matches} of ${place.items} match · ${place.ids.join(", ")}${place.matches > place.ids.length ? ", …" : ""}`);
    else console.log(`  ${where} · none of ${place.items} match`);
  }
  const accounts = new Set(places.map((place) => place.account)).size;
  const tenants = new Set(places.filter((place) => place.tenant).map((place) => place.tenant.id)).size;
  const scope = `${count(accounts, "account")}${tenants ? ` × ${count(tenants, "tenant")}` : ""}`;
  const unread = failed.length ? `; ${failed.length} not searched` : "";
  if (found.length) console.log(`Found in ${found.length} of ${count(read, "place")} searched (${scope}${unread}).`);
  else console.log(`Found nowhere — ${count(read, "place")} searched (${scope}${unread}).`);
  const result = found.length ? `found: ${found.slice(0, 3).map((place) => `${place.account}${tenantOf(place)}`).join(", ")}${found.length > 3 ? ", …" : ""}` : `none${unread}`;
  console.log(`searched: stand:find ${searched} — ${scope} (${result})`);
  return found.length ? 0 : 1;
}

const call = readArgs(process.argv.slice(2));
const apps = appsOfMap();
if (!call.app) wrongCall("which app?");
if (!apps.includes(call.app)) wrongCall(`no app "${call.app}" in specs/project-map.md §Apps and services (apps: ${apps.join(", ") || "none yet"})`);
if (call.in === undefined) wrongCall("--in is missing — the GET to search with");
const target = getPath(call.in, "--in");
const conditions = conditionsOf(call.where);
const tenants = tenantsLine(call.app);
if (target.includes("{tenant}") && !tenants) {
  wrongCall(`--in has {tenant}, but ${call.app}'s \`\`\`auth block has no tenants: line — add one (tenants: GET /api/<list> → id, name), or search without {tenant}`);
}
const places = searchStand({ app: call.app, path: target, tenants: target.includes("{tenant}") ? tenants : undefined, accounts: call.accounts, conditions });
process.exit(print(places, `GET ${target}${call.where === undefined ? "" : ` where ${call.where.trim()}`}`));
