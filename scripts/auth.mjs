/**
 * The accounts of the test home's apps — is their login ready, and do they sign in?
 *
 * Check: reads every ```auth block of specs/project-map.md §Auth — one per app when the map lists
 * several (`platform: <app>`) — and checks that every .env variable it names is filled, for each role
 * (`<ROLE>` = the role in env form, `hr-admin` → `HR_ADMIN`). Prints names only, never a value.
 *
 *   npm run auth:check                            every app and role
 *   npm run auth:check -- manager                 only the roles a plan needs (exit 1 when one is not ready)
 *   npm run auth:check -- crm:manager             a role of one app
 *   npm run auth:check -- crm                     every role of one app
 *
 * Sign in: signs an app's accounts in and checks them — the sign-in smoke for the accounts it leaves
 * out (it checks the first account only: "is the stand alive?"). Each role's session lands in state/,
 * so a role can be explored with (the MCP browser started with --storage-state) without its password typed anywhere. A
 * refused password is never tried again as it is (src/setup/auth/state.ts) — fix it in .env.
 *
 *   npm run auth:sign-in -- my-app manager        one role
 *   npm run auth:sign-in -- my-app all            every role of the app
 *   npm run auth:sign-in -- my-app                the first account (what the smoke checks)
 */
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { appsOfMap, ensureBrowsers } from "./run-tests.mjs";

dotenv.config({ quiet: true });

// A further account's own line (`login member:`, `password member:`, `key member:`) — as auth-config.ts reads it.
const ROLE_LINE = /^(login|password|key) (?!(?:url|body|format|header|prefix)\s*:)([a-z0-9-]+)\s*:/;

/** Whether the .env values the asked roles' login needs are filled — each role on a line of its own. */
function checkLogin(args) {
  const map = fs.readFileSync(path.join(process.cwd(), "specs", "project-map.md"), "utf8").replace(/\r\n/g, "\n");
  const written = [...map.matchAll(/```auth\n([\s\S]*?)```/g)].map((match) => match[1].split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")));
  const keyOf = (line) => line.slice(0, line.indexOf(":")).trim();
  const valueIn = (lines, key) => {
    const line = lines.find((entry) => keyOf(entry) === key);
    return line?.slice(line.indexOf(":") + 1).trim();
  };
  // `sign-in like: <app>` = that app's lines, with what this block writes in their place (token field /
  // login body: field by field) — the same reading as src/setup/auth/auth-config.ts.
  const PAIR_KEYS = new Set(["token field", "login body"]);
  const fieldOf = (line) => line.slice(line.indexOf(":") + 1).split("=")[0].trim();
  const signInLines = (lines, seen = []) => {
    const like = valueIn(lines, "sign-in like");
    if (!like) return lines;
    const base = written.find((other) => valueIn(other, "platform") === like);
    if (!base || seen.includes(like)) return undefined;
    const inherited = signInLines(base, [...seen, valueIn(lines, "platform")]);
    if (!inherited) return undefined;
    const replaces = (line) => lines.some((own) => keyOf(own) === keyOf(line) && (!PAIR_KEYS.has(keyOf(line)) || fieldOf(own) === fieldOf(line)));
    return [...lines.filter((line) => keyOf(line) !== "sign-in like"), ...inherited.filter((line) => keyOf(line) !== "platform" && !replaces(line))];
  };
  const blocks = written.map((own) => {
    const lines = signInLines(own) ?? own;
    const value = (key) => valueIn(lines, key);
    const listed = (value("roles") ?? "").split(",").map((role) => role.trim()).filter(Boolean);
    const signsIn = [value("ui"), value("api")].some((mode) => mode !== undefined && mode !== "none");
    // A further account's own lines (`login member: …`) list its role — as auth-config.ts reads them.
    const ownLines = (role) => Object.fromEntries(lines.map((line) => ROLE_LINE.exec(line)).filter((match) => match && match[2] === role).map((match) => [match[1], valueIn(lines, `${match[1]} ${role}`)]));
    const further = [...new Set(lines.map((line) => ROLE_LINE.exec(line)?.[2]).filter(Boolean))];
    // Roles are optional: a login with no roles: line is one test account ("user", .env names without <ROLE>).
    const base = listed.length ? listed : signsIn ? ["user"] : [];
    const roles = [...base, ...further.filter((role) => !base.includes(role))];
    const single = roles.length === 1 && roles[0] === "user";
    const like = valueIn(own, "sign-in like");
    return { platform: value("platform"), lines, value, ownLines, single, roles, like, broken: like !== undefined && !signInLines(own) };
  });

  if (blocks.length === 0) {
    console.log("Login is not set up yet (no ```auth block in specs/project-map.md §Auth) — the setup skill (/setup) sets it up.");
    return true;
  }

  // How .env holds each value, read as text — only to say when dotenv would read a value other than
  // the one written (never printed): unquoted, a `#` starts a comment and cuts the rest; an open quote
  // that never closes. A password with `#` is the usual "wrong password" that is not one.
  const rawLines = fs.existsSync(path.join(process.cwd(), ".env")) ? fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").split(/\r?\n/) : [];
  const misread = (name) => {
    const line = rawLines.find((entry) => new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`).test(entry));
    if (!line) return undefined;
    const value = line.slice(line.indexOf("=") + 1).trim();
    const quote = /^["'`]/.exec(value)?.[0];
    if (quote) return value.length > 1 && value.indexOf(quote, 1) !== -1 ? undefined : `${name} opens a ${quote} that never closes`;
    return /(^|[^\s])#/.test(value) ? `${name} is read only up to its # — outside quotes, # starts a comment in .env. Write it in double quotes: ${name}="…"` : undefined;
  };

  const several = blocks.length > 1;
  // The names a role's sign-in reads: every other role's own lines left out, and the first account's
  // login, password and key read as this role's own when it has them.
  const names = (block, role) => {
    let text = block.lines.filter((line) => !ROLE_LINE.test(line)).join("\n");
    for (const [field, own] of Object.entries(block.ownLines(role))) {
      const first = block.value(field);
      if (first && own) text = text.split(first).join(own);
    }
    return [...new Set([...text.replace(/<ROLE>/g, role.toUpperCase().replace(/-/g, "_")).matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1]))];
  };
  // What to check: a role, `<app>:<role>`, or an app's name — every role of that app.
  const platforms = blocks.map((block) => block.platform).filter(Boolean);
  const asked = args.map((entry) => {
    if (entry.includes(":")) return { platform: entry.split(":")[0], role: entry.split(":")[1] };
    const isRole = blocks.some((block) => block.roles.includes(entry));
    return !isRole && platforms.includes(entry) ? { platform: entry, role: "*" } : { role: entry };
  });
  const wants = (want, block, role) => (!want.platform || want.platform === block.platform) && (want.role === "*" || want.role === role);

  let ready = true;
  for (const want of asked) {
    if (!blocks.some((block) => block.roles.some((role) => wants(want, block, role)))) {
      ready = false;
      const roles = [...new Set(blocks.flatMap((block) => block.roles))].join(", ") || "none";
      console.log(
        `✗ ${want.platform ? `${want.platform}:` : ""}${want.role} — no such role in specs/project-map.md §Auth (roles: ${roles}${platforms.length ? `; apps: ${platforms.join(", ")}` : ""}) — ask for a role, <app>:<role> or an app`,
      );
    }
  }
  for (const block of blocks) {
    if (block.broken) {
      ready = false;
      console.log(`✗ ${block.platform ?? "?"} — signs in like "${block.like}", which has no \`\`\`auth block of its own (or the chain goes round in a circle)`);
      continue;
    }
    const roles = asked.length ? block.roles.filter((role) => asked.some((want) => wants(want, block, role))) : block.roles;
    if (!asked.length && roles.length === 0) console.log(`- ${several ? `${block.platform ?? "?"}: ` : ""}no login (tests run without a session)`);
    for (const role of roles) {
      const problems = names(block, role).map(misread).filter(Boolean);
      const missing = names(block, role).filter((name) => !process.env[name] && !problems.some((problem) => problem.startsWith(`${name} `)));
      if (missing.length || problems.length) ready = false;
      const who = block.single ? (block.value("ui") === "none" ? "test client" : "test account") : role;
      const label = several ? `${block.platform ?? "?"} — ${who}${block.like ? ` (signs in like ${block.like})` : ""}` : who;
      if (missing.length) console.log(`✗ ${label} — fill in .env yourself: ${missing.join(", ")}`);
      for (const problem of problems) console.log(`✗ ${label} — ${problem}`);
      if (!missing.length && !problems.length) console.log(`✓ ${label}`);
    }
  }
  // Two apps with sign-in services of their own (no `sign-in like` between them) holding the same login
  // and password: usually one app's account copied to the other, whose service may not know that
  // password — and every wrong attempt counts toward its lockout. Compared, never printed.
  const rootOf = (block, seen = []) => {
    const base = block.like ? blocks.find((other) => other.platform === block.like) : undefined;
    return base && !seen.includes(base) ? rootOf(base, [...seen, block]) : block;
  };
  const credentialsOf = (block, role) => {
    const valueOf = (key) => {
      const template = block.ownLines(role)[key] ?? block.value(key) ?? "";
      const name = /\$\{([A-Z0-9_]+)\}/.exec(template.replace(/<ROLE>/g, role.toUpperCase().replace(/-/g, "_")))?.[1];
      return name ? process.env[name] : undefined;
    };
    const [login, password] = [valueOf("login"), valueOf("password")];
    return login && password ? `${login}\n${password}` : undefined;
  };
  blocks.forEach((earlier, index) => {
    for (const later of blocks.slice(index + 1)) {
      if (rootOf(earlier) === rootOf(later)) continue;
      const shared = later.roles.some((role) => earlier.roles.some((other) => credentialsOf(later, role) && credentialsOf(later, role) === credentialsOf(earlier, other)));
      if (shared) {
        console.log(
          `! ${later.platform ?? "?"} uses the same login and password as ${earlier.platform ?? "?"}, but signs in through its own service (no "sign-in like") — ` +
            `that service may not know this password. Sign in by hand once on ${later.platform ?? "?"} before a test tries it`,
        );
      }
    }
  });
  return ready;
}

/** Runs the sign-in smoke for one role, every role or the first account of an app. */
function signIn([app, role, ...options]) {
  const apps = appsOfMap();
  if (!app || !apps.includes(app)) {
    console.error(`Which app? npm run auth:sign-in -- <app> [<role>|all] — apps in specs/project-map.md: ${apps.join(", ") || "none yet"}`);
    return 1;
  }
  ensureBrowsers();
  const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
  // No role given → the first word may already be a Playwright option (`-- crm --headed`).
  const named = role && !role.startsWith("-");
  const extra = named || !role ? options : [role, ...options];
  const command = ["npx", "playwright", "test", "tests/smoke/sign-in.smoke.spec.ts", quote(`--project=smoke:${app}`), ...extra.map(quote)].join(" ");
  const env = named ? { ...process.env, AQA_SIGN_IN: `${app}:${role}` } : process.env;
  return spawnSync(command, { stdio: "inherit", shell: true, env }).status ?? 1;
}

const [command, ...args] = process.argv.slice(2);
if (command === "check") process.exit(checkLogin(args) ? 0 : 1);
if (command === "sign-in") process.exit(signIn(args));
console.error("node scripts/auth.mjs check [<role>|<app>:<role>|<app>]... | sign-in <app> [<role>|all]");
process.exit(1);
