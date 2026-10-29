/**
 * Prepares .env without showing what is in it — the agent sets non-secret values (URLs, a public
 * client id) and adds empty entries the engineer fills in themselves (logins, passwords, secrets).
 * Prints names and filled/empty only, never a value. Creates .env from .env.example when missing,
 * and refuses to touch it when git would commit it.
 *
 * Every name it adds also goes to .env.example (committed — the list a teammate fills in): empty;
 * only an address (an http(s) URL) keeps its value there, so a teammate gets the stand's URLs. A
 * login, password or secret never reaches .env.example.
 *
 * Both files are laid out by app, as specs/project-map.md has them: run settings first, then one
 * section per app — its addresses and settings, then its test accounts (the first one, then each
 * further role's) — and names the map does not know under "Other". Values stay as they are; a note
 * written right above a name moves with it.
 *
 *   npm run env:prepare -- UI_BASE_URL=https://app.example.com     set a non-secret value
 *   npm run env:prepare -- --note "Test account" APP_LOGIN APP_PASSWORD   add empty entries under a note
 *   npm run env:prepare -- UI_BASE_URL APP_LOGIN                    only report filled/empty
 *   npm run env:prepare -- --tidy                                   lay both files out again
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), ".env");
const example = path.join(process.cwd(), ".env.example");
const mapFile = path.join(process.cwd(), "specs", "project-map.md");

try {
  execFileSync("git", ["check-ignore", "-q", ".env"], { stdio: "ignore" });
} catch (error) {
  // 1 = git would commit .env; anything else (no git, not a repository) is fine.
  if (error.status === 1) {
    console.log("✗ .env is not git-ignored — add .env and state/ to .gitignore before entering any value");
    process.exit(1);
  }
}

const read = (target) => (fs.existsSync(target) ? fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n") : "");
// A plain address only: no credentials in it (user:pass@host) and no query (?token=…).
const isAddress = (value) => /^https?:\/\/[^/@?#\s]+(\/[^?#\s]*)?$/i.test(value);
const ACCOUNT_NOTE = / — enter the values (?:here|in \.env) yourself(?:, not in chat)?$/;
// Lines this script writes itself, and the older template's wording — laid out anew, never kept as notes.
const GENERATED = [
  /^# ─── /,
  /^# Addresses and settings$/,
  /^# Copy to \.env/,
  /^# Values for this machine/,
  /^# The names come from specs\/project-map\.md/,
  /^# Specs must not read process\.env/,
  /^# Never derive an API host/,
  /^# Extra app\/service names belong/,
  /^# Example extra targets/,
  /^# Login: the [a-z]+ skill adds/,
  /^# Logins, passwords and client secrets are entered here/,
  /^# Network \(optional\)/,
  /^# first request time out/,
];

// The older template's commented-out examples — not the project's entries.
const OLD_EXAMPLES = new Set(["FRONTEND_URL", "AUTH_API_URL"]);
// What a run setting does, written above it when no note is there.
const RUN_NOTES = {
  AQA_SKIP_IPV6_LOOKUP: [
    "# A DNS server slow to answer IPv6 lookups for an IPv4-only stand makes every first request time",
    '# out (Playwright waits for both). "true" skips IPv6 lookups (IPv4 only).',
  ],
};

/** A file as its entries — name, value, whether it is commented out, the notes right above it — and loose notes. */
function parse(text) {
  const entries = new Map();
  const loose = [];
  let notes = [];
  let groupNote;
  for (const line of text.split("\n")) {
    // As dotenv reads it: spaces around "=", an `export ` in front — a line read otherwise would be lost on rewrite.
    const entry = /^\s*(#\s*)?(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (entry && entry[1] && OLD_EXAMPLES.has(entry[2])) {
      notes = [];
      continue;
    }
    if (entry) {
      entries.set(entry[2], { value: entry[3], commented: Boolean(entry[1]), notes, groupNote });
      notes = [];
      groupNote = undefined;
    } else if (!line.trim()) {
      loose.push(...notes);
      notes = [];
    } else if (line.startsWith("#")) {
      if (ACCOUNT_NOTE.test(line)) groupNote = line.replace(/^#\s*/, "").replace(ACCOUNT_NOTE, "");
      else if (!GENERATED.some((pattern) => pattern.test(line))) notes.push(line);
    }
  }
  return { entries, loose: [...loose, ...notes] };
}

/** The map's apps in order, each with its names: addresses and settings, and the test accounts by role. */
function mapGroups() {
  const map = read(mapFile);
  const apps = [];
  const appOf = (slug) => {
    let app = apps.find((entry) => entry.slug === slug);
    if (!app) apps.push((app = { slug, stand: [], accounts: new Map() }));
    return app;
  };
  const placed = new Set();
  const place = (list, name) => {
    if (placed.has(name)) return;
    placed.add(name);
    list.push(name);
  };
  const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(map)?.[1] ?? "";
  const rows = section.split("\n").filter((line) => line.startsWith("|")).map((line) => line.split("|").map((cell) => cell.trim()));
  const tableNames = rows.filter(([, slug]) => slug && slug !== "Platform" && !/^-+$/.test(slug)).map(([, slug, , , env]) => ({ slug, name: /`([A-Z0-9_]+)`/.exec(env ?? "")?.[1] }));
  for (const { slug } of tableNames) appOf(slug);
  const blocks = [...map.matchAll(/```auth\n([\s\S]*?)```/g)].map((match) => match[1].split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")));
  const namesIn = (text, roles) => [...new Set(roles.flatMap((role) => [...text.replace(/<ROLE>/g, role.toUpperCase().replace(/-/g, "_")).matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1])))];
  // Accounts first, so a login used again in a token field stays with its account.
  for (const lines of blocks) {
    const app = appOf(/^platform:\s*(\S+)/.exec(lines.find((line) => line.startsWith("platform:")) ?? "")?.[1] ?? apps[0]?.slug ?? "app");
    const roles = (/^roles:\s*(.+)$/.exec(lines.find((line) => line.startsWith("roles:")) ?? "")?.[1] ?? "user").split(",").map((role) => role.trim()).filter(Boolean);
    for (const line of lines) {
      // `login url:`, `login body:`, `key header:` … are the sign-in request's own lines, never a role.
      const own = /^(login|password|key) (?!(?:url|body|format|header|prefix):)([a-z0-9-]+):/.exec(line);
      const first = /^(login|password|key):/.test(line);
      if (!own && !first) continue;
      const role = own ? own[2] : roles[0];
      if (!app.accounts.has(role)) app.accounts.set(role, []);
      for (const name of namesIn(line, own ? [role] : roles)) place(app.accounts.get(role), name);
    }
  }
  for (const { slug, name } of tableNames) if (name) place(appOf(slug).stand, name);
  for (const lines of blocks) {
    const app = appOf(/^platform:\s*(\S+)/.exec(lines.find((line) => line.startsWith("platform:")) ?? "")?.[1] ?? apps[0]?.slug ?? "app");
    const secret = (line) => /^(token field|login body):\s*(password|client_secret|secret)\s*=/.test(line);
    for (const line of lines) {
      for (const name of namesIn(line, ["user"])) {
        if (!secret(line)) place(app.stand, name);
        else {
          if (!app.accounts.has("user")) app.accounts.set("user", []);
          place(app.accounts.get("user"), name);
        }
      }
    }
  }
  return apps;
}

/** The file laid out by app. `forExample`: the committed list a teammate fills in. */
function render({ entries, loose }, apps, forExample) {
  const out = forExample
    ? ["# Copy to .env and fill in the values there — .env stays on your machine, never committed.", "# The names come from specs/project-map.md; tests never read them directly (config and fixtures do).", ""]
    : ["# Values for this machine — never committed. The names come from specs/project-map.md (.env.example lists them).", ""];
  const used = new Set();
  const emit = (name) => {
    const entry = entries.get(name);
    if (!entry || used.has(name)) return;
    used.add(name);
    out.push(...(entry.notes.length ? entry.notes : RUN_NOTES[name] ?? []), `${entry.commented ? "# " : ""}${name}=${entry.value}`);
  };
  const heading = (title) => out.push(`# ─── ${title} ${"─".repeat(Math.max(3, 60 - title.length))}`);
  const yourself = forExample ? "enter the values in .env yourself, not in chat" : "enter the values here yourself, not in chat";

  const runNames = [...entries.keys()].filter((name) => name.startsWith("AQA_"));
  if (runNames.length) {
    heading("Run settings");
    runNames.forEach(emit);
    out.push("");
  }
  for (const app of apps) {
    const stand = app.stand.filter((name) => entries.has(name));
    const accounts = [...app.accounts].map(([role, names]) => [role, names.filter((name) => entries.has(name))]).filter(([, names]) => names.length);
    if (!stand.length && !accounts.length) continue;
    heading(app.slug);
    if (stand.length) {
      out.push("# Addresses and settings");
      stand.forEach(emit);
    }
    for (const [role, names] of accounts) {
      const note = names.map((name) => entries.get(name).groupNote).find(Boolean) ?? (role === "user" ? "Test account" : `Test account "${role}"`);
      out.push(`# ${note} — ${yourself}`);
      names.forEach(emit);
    }
    out.push("");
  }
  const rest = [...entries.keys()].filter((name) => !used.has(name));
  if (rest.length || loose.length) {
    heading("Other");
    out.push(...loose);
    rest.forEach(emit);
    out.push("");
  }
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

const created = !fs.existsSync(file);
if (created) fs.writeFileSync(file, read(example), "utf8");
const env = parse(read(file));
const exampleFile = parse(read(example));

/**
 * A value as .env must hold it for dotenv to read it back whole: quoted when it has a `#` (a comment
 * otherwise), a quote or edge spaces, with a quote character it does not contain.
 */
function written(value) {
  if (!/[#"'`]|^\s|\s$/.test(value)) return value;
  const quote = ['"', "'", "`"].find((mark) => !value.includes(mark)) ?? '"';
  return `${quote}${value}${quote}`;
}

/** A value with its quotes taken off — `""` is as empty as nothing. */
const unquoted = (value) => value.trim().replace(/^(["'`])(.*)\1$/, "$2");

let note;
const report = [];
if (created) report.push("✓ .env created from .env.example — enter the empty values there yourself");
const args = process.argv.slice(2).filter((arg) => arg !== "--tidy");
for (const arg of args) {
  if (arg === "--note") {
    note = "";
    continue;
  }
  if (note === "") {
    note = arg;
    continue;
  }
  const [name, ...rest] = arg.split("=");
  const value = rest.join("=");
  const known = env.entries.get(name);
  if (rest.length) {
    env.entries.set(name, { notes: [], ...known, value: written(value), commented: false });
    const inExample = exampleFile.entries.get(name);
    exampleFile.entries.set(name, { notes: [], ...inExample, value: isAddress(value) ? written(value) : inExample?.value ?? "", commented: false });
    report.push(`✓ ${name} set`);
    continue;
  }
  env.entries.set(name, { notes: [], value: "", ...known, commented: false, groupNote: known?.groupNote ?? (note || undefined) });
  const inExample = exampleFile.entries.get(name);
  exampleFile.entries.set(name, { notes: [], value: "", ...inExample, commented: false, groupNote: inExample?.groupNote ?? (note || undefined) });
  const filled = unquoted(env.entries.get(name).value) !== "";
  report.push(filled ? `✓ ${name} filled` : `✗ ${name} empty — fill it in .env yourself`);
}

const apps = mapGroups();
fs.writeFileSync(file, render(env, apps, false), "utf8");
fs.writeFileSync(example, render(exampleFile, apps, true), "utf8");
if (process.argv.includes("--tidy")) report.push(`✓ .env and .env.example laid out by app (${apps.map((app) => app.slug).join(", ") || "no apps yet"})`);
console.log(report.join("\n") || "Nothing to prepare — name the entries (NAME or NAME=value), or --tidy to lay the files out again.");
