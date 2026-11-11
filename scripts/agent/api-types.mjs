/**
 * Writes each app's API types from its contract — the Docs cell of the app's API row in
 * specs/project-map.md §Apps and services (`{API_BASE_URL}/swagger.json`, .env names in braces) — to
 * src/api/clients/<app>/contract.client.ts. The app's clients take their answer types from it
 * (`components["schemas"]["Order"]`) and tie their answer schemas to it (`fieldsOf`,
 * src/assertions/shared/http.ts; agents/rules/api.md §Response schemas). Run again when the API
 * changes; `npm run typecheck` then names every client and test to update. A contract that cannot be
 * read leaves the app's file as it was. OpenAPI 3 only (openapi-typescript); operations with a method it
 * does not read (OpenAPI 3.2's `query`) are left out of the types — a warning names them.
 *
 *   npm run api:types              every app whose API row names a contract
 *   npm run api:types -- <app>     one app
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ quiet: true });
const root = process.cwd();
const only = process.argv[2];
const mapFile = path.join(root, "specs", "project-map.md");
const map = fs.existsSync(mapFile) ? fs.readFileSync(mapFile, "utf8").replace(/\r\n/g, "\n") : "";
const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(map)?.[1] ?? "";

// The API rows whose Docs cell names a contract (in backticks or plain).
const apps = section
  .split("\n")
  .filter((line) => line.startsWith("|"))
  .flatMap((row) => {
    const [app, , kind, , docs = ""] = row.split("|").slice(1).map((cell) => cell.trim());
    const address = /`([^`]+)`/.exec(docs)?.[1] ?? /(?:https?:\/\/|\{[A-Z0-9_]+\})\S+/.exec(docs)?.[0];
    return /^api\b/i.test(kind ?? "") && address && (!only || app === only) ? [{ app, address }] : [];
  });

if (!apps.length) {
  const which = only ? `The API row of "${only}" names no contract` : "No API row of specs/project-map.md §Apps and services names a contract";
  console.log(`${which} in its Docs column (\`{API_BASE_URL}/swagger.json\`) — the clients keep their hand-written types.`);
  process.exit(only ? 1 : 0);
}

let openapiTS;
try {
  ({ default: openapiTS } = await import("openapi-typescript"));
} catch {
  console.error("openapi-typescript is not installed — run npm install (package.json lists it).");
  process.exit(1);
}

// The methods openapi-typescript 6 writes; a path item's other fields are not operations.
const READ_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);
const PATH_FIELDS = new Set(["summary", "description", "servers", "parameters", "$ref", "additionalOperations"]);

/**
 * The operations the generated types leave out without a word: methods openapi-typescript 6 does not
 * read — OpenAPI 3.2's `query`, a path item's `additionalOperations` — each { method, route }.
 */
function leftOut(contract) {
  const left = [];
  for (const [route, item] of Object.entries(contract.paths ?? {})) {
    if (!item || typeof item !== "object") continue;
    for (const [key, value] of Object.entries(item)) {
      if (!READ_METHODS.has(key) && !PATH_FIELDS.has(key) && value && typeof value === "object") left.push({ method: key, route });
    }
    for (const method of Object.keys(item.additionalOperations ?? {})) left.push({ method, route });
  }
  return left;
}

let failed = 0;
for (const { app, address } of apps) {
  const file = path.join("src", "api", "clients", app, "contract.client.ts");
  const full = path.join(root, file);
  const before = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  try {
    const unset = [...address.matchAll(/\{([A-Z0-9_]+)\}/g)].map(([, name]) => name).filter((name) => !process.env[name]?.trim());
    if (unset.length) throw new Error(`${unset.join(", ")} not set in .env`);
    const url = address.replace(/\{([A-Z0-9_]+)\}/g, (_, name) => process.env[name].trim().replace(/\/+$/, ""));
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`it answered ${response.status}`);
    const contract = await response.json().catch(() => {
      throw new Error("it is not JSON");
    });
    if (!/^3\./.test(String(contract.openapi ?? ""))) throw new Error(`it is not OpenAPI 3 (${contract.swagger ? `Swagger ${contract.swagger}` : "no openapi version"})`);
    const types = await openapiTS(contract, { commentHeader: `// Written by npm run api:types from ${address} — never edited by hand: run it again when the API changes.\n` });
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, types);
    const schemas = Object.keys(contract.components?.schemas ?? {}).length;
    const what = before === types ? "unchanged" : before ? "updated — npm run typecheck names every place to update" : "written";
    console.log(`${app}: ${file.split(path.sep).join("/")} ${what} (${schemas} answer types).`);
    const left = leftOut(contract);
    if (left.length) {
      const methods = [...new Set(left.map(({ method }) => method.toLowerCase()))].join(", ");
      const where = left.map(({ method, route }) => `${method.toUpperCase()} ${route}`);
      console.log(`! ${app}: ${left.length} operations left out — methods openapi-typescript 6 does not read: ${methods} (${where.slice(0, 5).join(", ")}${where.length > 5 ? `, … ${where.length - 5} more` : ""}) — a client for one keeps hand-written types`);
    }
  } catch (error) {
    failed += 1;
    const reason = error.cause?.code ? `${error.message} (${error.cause.code})` : error.message;
    console.error(`${app}: the contract ${address} could not be read — ${reason}; ${before ? `${file.split(path.sep).join("/")} stays as it was` : "the clients keep their hand-written types"}.`);
  }
}
process.exit(failed ? 1 : 0);
