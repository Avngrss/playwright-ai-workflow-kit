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
 * Both files keep their order, headings and notes: a value changes in its own line, and a missing
 * name is added next to its group as specs/project-map.md has it (its app's addresses, or its test
 * account) — else at the end of its app's section, under its --note (names the map does not know:
 * under "Other"). `--tidy` lays both files out by app instead — run settings, then per app its
 * addresses and settings and its test accounts; every value and note kept.
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
// Lines this script writes itself, and the older template's wording — laid out anew by --tidy, never kept as notes.
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
const EXAMPLE_HEADER = ["# Copy to .env and fill in the values there — .env stays on your machine, never committed.", "# The names come from specs/project-map.md; tests never read them directly (config and fixtures do)."];
const ENV_HEADER = "# Values for this machine — never committed. The names come from specs/project-map.md (.env.example lists them).";

// The older template's commented-out examples — not the project's entries.
const OLD_EXAMPLES = new Set(["FRONTEND_URL", "AUTH_API_URL"]);
// What a run setting does, written above it when no note is there.
const RUN_NOTES = {
  AQA_SKIP_IPV6_LOOKUP: [
    "# A DNS server slow to answer IPv6 lookups for an IPv4-only stand makes every first request time",
    '# out (Playwright waits for both). "true" skips IPv6 lookups (IPv4 only).',
  ],
};
// A further account's own line (`login member: …`) — `login url:`, `key header:` and the like are settings.
const ROLE_LINE = /^(login|password|key) (?!(?:url|body|format|header|prefix)\s*:)([a-z0-9-]+)\s*:/;

/**
 * An entry line as dotenv reads it — `NAME=value`, `NAME = value`, `export NAME=value` — or one
 * commented out (`# NAME=value`, no spaces: a note with an "=" in it stays a note).
 */
function entryOf(line) {
  const active = /^\s*(export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
  if (active) return { name: active[2], value: active[3], commented: false, exported: Boolean(active[1]) };
  const off = /^#\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
  return off ? { name: off[1], value: off[2], commented: true, exported: false } : undefined;
}
const lineFor = (name, { value, commented = false, exported = false }) => `${commented ? "# " : ""}${exported ? "export " : ""}${name}=${value}`;

/**
 * A value as .env must hold it: dotenv reads an unquoted value only up to a `#`, trimmed, and takes a
 * leading quote for an opening one — such a value goes in quotes, so .env keeps what was given. Single
 * quotes first: inside double ones dotenv turns `\n` into a line break.
 */
function fileValue(value) {
  if (!/#|^\s|\s$|^["'`]/.test(value)) return value;
  const quote = ["'", '"', "`"].find((mark) => !value.includes(mark));
  return quote ? `${quote}${value}${quote}` : value;
}

/** A value with its quotes taken off — `""` is as empty as nothing. */
const unquoted = (value) => value.trim().replace(/^(["'`])(.*)\1$/, "$2");

/** A file as its entries — name, value, whether it is commented out, the notes right above it — and loose notes. */
function parse(text) {
  const entries = new Map();
  const loose = [];
  let notes = [];
  let groupNote;
  for (const line of text.split("\n")) {
    const entry = entryOf(line);
    if (entry && entry.commented && OLD_EXAMPLES.has(entry.name)) {
      notes = [];
      continue;
    }
    if (entry) {
      entries.set(entry.name, { ...entry, notes, groupNote });
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
      const own = ROLE_LINE.exec(line);
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

const heading = (title) => `# ─── ${title} ${"─".repeat(Math.max(3, 60 - title.length))}`;
const yourselfIn = (forExample) => (forExample ? "enter the values in .env yourself, not in chat" : "enter the values here yourself, not in chat");
const accountNote = (role, note, forExample) => `# ${note ?? (role === "user" ? "Test account" : `Test account "${role}"`)} — ${yourselfIn(forExample)}`;

/** --tidy: the file laid out by app. `forExample`: the committed list a teammate fills in. */
function render({ entries, loose }, apps, forExample) {
  const out = forExample ? [...EXAMPLE_HEADER, ""] : [ENV_HEADER, ""];
  const used = new Set();
  // A --note heads its names wherever they stand — an account, a setting, "Other" — written once per group.
  let lastNote;
  const emit = (name) => {
    const entry = entries.get(name);
    if (!entry || used.has(name)) return;
    used.add(name);
    if (entry.groupNote && entry.groupNote !== lastNote) out.push(`# ${entry.groupNote} — ${yourselfIn(forExample)}`);
    lastNote = entry.groupNote;
    out.push(...(entry.notes.length ? entry.notes : RUN_NOTES[name] ?? []), lineFor(name, entry));
  };
  const section = (title) => {
    out.push(heading(title));
    lastNote = undefined;
  };

  const runNames = [...entries.keys()].filter((name) => name.startsWith("AQA_"));
  if (runNames.length) {
    section("Run settings");
    runNames.forEach(emit);
    out.push("");
  }
  for (const app of apps) {
    const stand = app.stand.filter((name) => entries.has(name));
    const accounts = [...app.accounts].map(([role, names]) => [role, names.filter((name) => entries.has(name))]).filter(([, names]) => names.length);
    if (!stand.length && !accounts.length) continue;
    section(app.slug);
    if (stand.length) {
      out.push("# Addresses and settings");
      stand.forEach(emit);
    }
    for (const [role, names] of accounts) {
      lastNote = names.map((name) => entries.get(name).groupNote).find(Boolean);
      out.push(accountNote(role, lastNote, forExample));
      names.forEach(emit);
    }
    out.push("");
  }
  const rest = [...entries.keys()].filter((name) => !used.has(name));
  if (rest.length || loose.length) {
    section("Other");
    out.push(...loose);
    rest.forEach(emit);
    out.push("");
  }
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

/**
 * One file edited in place: every line it has stays where it is; a value changes in its own line,
 * and a missing name joins its group (after the group's last name), else the end of its section.
 */
function editor(text, apps, forExample) {
  const lines = text.replace(/\n+$/, "").split("\n").filter((line, index, all) => all.length > 1 || line);
  // The template's placeholder section becomes the first app's once the map names it.
  const firstApp = apps[0]?.slug;
  if (firstApp && !apps.some((app) => app.slug === "default") && !lines.some((line) => line.startsWith(`# ─── ${firstApp} `))) {
    const placeholder = lines.findIndex((line) => line.startsWith("# ─── default "));
    if (placeholder !== -1) lines[placeholder] = heading(firstApp);
  }
  const at = (name) => {
    const active = lines.findIndex((line) => entryOf(line)?.name === name && !entryOf(line).commented);
    return active !== -1 ? active : lines.findIndex((line) => entryOf(line)?.name === name);
  };
  const groupOf = (name) => {
    if (name.startsWith("AQA_")) return { title: "Run settings", names: lines.map((line) => entryOf(line)?.name).filter((other) => other?.startsWith("AQA_")) };
    for (const app of apps) {
      if (app.stand.includes(name)) return { title: app.slug, names: app.stand, stand: true };
      for (const [role, names] of app.accounts) if (names.includes(name)) return { title: app.slug, names, role };
    }
    return { title: "Other", names: [] };
  };
  let last; // the name added last in this run, its section and note — the next one of the same goes after it
  const add = (name, value, note) => {
    const group = groupOf(name);
    const entry = lineFor(name, { value });
    const siblings = group.names.filter((other) => other !== name).map(at).filter((index) => index !== -1);
    const after = siblings.length ? Math.max(...siblings) : last && last.title === group.title && last.note === note ? at(last.name) : -1;
    last = { name, title: group.title, note };
    if (after !== -1) return lines.splice(after + 1, 0, entry);
    const noteLines = group.title === "Run settings"
      ? RUN_NOTES[name] ?? []
      : group.role
        ? [accountNote(group.role, note, forExample)]
        : note
          ? [`# ${note}${value ? "" : ` — ${yourselfIn(forExample)}`}`]
          : group.stand
            ? ["# Addresses and settings"]
            : [];
    const start = lines.findIndex((line) => line.startsWith(`# ─── ${group.title} `));
    if (start !== -1) {
      let end = lines.findIndex((line, index) => index > start && line.startsWith("# ─── "));
      if (end === -1) end = lines.length;
      while (end > start + 1 && !lines[end - 1].trim()) end -= 1;
      return lines.splice(end, 0, ...noteLines, entry);
    }
    // A new section: before "Other", which stays last.
    const other = group.title === "Other" ? -1 : lines.findIndex((line) => line.startsWith("# ─── Other "));
    if (other !== -1) return lines.splice(other, 0, heading(group.title), ...noteLines, entry, "");
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push(...(lines.length ? [""] : []), heading(group.title), ...noteLines, entry);
  };
  return {
    valueOf: (name) => (at(name) === -1 ? undefined : entryOf(lines[at(name)]).value),
    /** The name with this value — in its own line (uncommented), or added. */
    put(name, value, note) {
      const index = at(name);
      if (index === -1) return add(name, value, note);
      lines[index] = lineFor(name, { value, exported: entryOf(lines[index]).exported });
    },
    /** The name present and active — its line as it is (a commented-out one taken in), or added empty. */
    ensure(name, note) {
      const index = at(name);
      if (index === -1) return add(name, "", note);
      const entry = entryOf(lines[index]);
      if (entry.commented) lines[index] = lineFor(name, { value: entry.value });
    },
    text: () => `${lines.join("\n").replace(/\n+$/, "")}\n`,
  };
}

/** A new .env: the committed list as it is, its header and "fill in .env" notes said for .env itself. */
function envFromExample(text) {
  const body = text
    .split("\n")
    .filter((line) => !EXAMPLE_HEADER.includes(line))
    .join("\n")
    .replace(/^\n+/, "")
    .replaceAll(" — enter the values in .env yourself", " — enter the values here yourself");
  return `${ENV_HEADER}\n\n${body}`;
}

/** Writes a file only when its text changed, keeping its line endings. */
function save(target, text) {
  const before = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : undefined;
  if (before !== undefined && before.replace(/\r\n/g, "\n") === text) return;
  fs.writeFileSync(target, before?.includes("\r\n") ? text.replace(/\n/g, "\r\n") : text, "utf8");
}

const apps = mapGroups();
const created = !fs.existsSync(file);
if (created) fs.writeFileSync(file, envFromExample(read(example)), "utf8");
const env = editor(read(file), apps, false);
const exampleFile = editor(read(example), apps, true);

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
  if (rest.length) {
    const value = rest.join("=");
    env.put(name, fileValue(value), note || undefined);
    if (isAddress(value)) exampleFile.put(name, value, note || undefined);
    else exampleFile.ensure(name, note || undefined);
    report.push(`✓ ${name} set`);
    continue;
  }
  env.ensure(name, note || undefined);
  exampleFile.ensure(name, note || undefined);
  const filled = unquoted(env.valueOf(name) ?? "") !== "";
  report.push(filled ? `✓ ${name} filled` : `✗ ${name} empty — fill it in .env yourself`);
}

const tidy = process.argv.includes("--tidy");
save(file, tidy ? render(parse(env.text()), apps, false) : env.text());
save(example, tidy ? render(parse(exampleFile.text()), apps, true) : exampleFile.text());
if (tidy) report.push(`✓ .env and .env.example laid out by app (${apps.map((app) => app.slug).join(", ") || "no apps yet"})`);
console.log(report.join("\n") || "Nothing to prepare — name the entries (NAME or NAME=value), or --tidy to lay the files out again.");
