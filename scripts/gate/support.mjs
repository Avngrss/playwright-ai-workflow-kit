import fs from "node:fs";
import { at, read, registeredPlatforms } from "./context.mjs";

/** The support code's wiring: the fixture chain, roles from the map, a sweep for every disposable fixture. */

// The chain, in order (.cursor/rules/data-and-fixtures.mdc): each layer imports the one before it and
// test.ts re-exports the last. Auth sits before data, so project data fixtures have `authHeaders`.
const CHAIN = ["base", "reporting", "api", "auth", "data", "pages"];

function checkFixtureChain(files, report) {
  const entry = at("src", "fixtures", "test.ts");
  if (!fs.existsSync(entry)) return;
  const layerFile = (layer) => at("src", "fixtures", `${layer}.fixture.ts`);
  const present = CHAIN.filter((layer) => fs.existsSync(layerFile(layer)));
  const content = read(entry);
  const last = present[present.length - 1];

  if (last && !content.includes(`./${last}.fixture`)) report.fail(entry, `re-exports test and expect from the last fixture layer (./${last}.fixture)`);
  if (content.includes("@playwright/test")) report.fail(entry, "the entry point re-exports the chain, never @playwright/test directly");
  if (!/\btest\b/.test(content) || !/\bexpect\b/.test(content)) report.fail(entry, "the entry point exports test and expect");

  present.forEach((layer, index) => {
    const layerContent = read(layerFile(layer));
    const parent = present[index - 1];
    if (parent && !new RegExp(`["']\\./${parent}\\.fixture["']`).test(layerContent)) {
      report.fail(layerFile(layer), `imports from ./${parent}.fixture (chain: ${present.join(" → ")})`);
    }
    if (layer !== "pages" && layerContent.includes("../pages/")) report.fail(layerFile(layer), "imports Page Objects — they are wired in src/fixtures/<app>/pages.fixture.ts");
  });

  // Each app's own chain sits on the shared one: data → ../test, pages → ./data.fixture, test.ts → ./pages.fixture.
  for (const app of registeredPlatforms()) {
    const own = (name) => at("src", "fixtures", app, name);
    if (!fs.existsSync(own("test.ts"))) continue; // the layout rule asks for npm run app:add
    const links = [
      ["data.fixture.ts", /from\s*["']\.\.\/test["']/, "builds on the shared chain — import { expect, test as base } from \"../test\""],
      ["pages.fixture.ts", /from\s*["']\.\/data\.fixture["']/, "builds on the app's data fixtures — import { expect, test as base } from \"./data.fixture\""],
      ["test.ts", /from\s*["']\.\/pages\.fixture["']/, "re-exports test and expect from ./pages.fixture"],
    ];
    for (const [name, link, says] of links) {
      if (!fs.existsSync(own(name)) || !link.test(read(own(name)))) report.fail(own(name), says);
    }
    if (fs.existsSync(own("data.fixture.ts")) && /\.\.\/\.\.\/pages\//.test(read(own("data.fixture.ts")))) report.fail(own("data.fixture.ts"), "imports Page Objects — they are wired in pages.fixture.ts next to it");
  }
}

function checkRolesFromMap(files, report) {
  // Roles and the default role live in specs/project-map.md §Auth only (auth-config.ts reads them) —
  // a role list written into code goes stale the day someone edits the map.
  const roleList = /type\s+\w*Role\s*=\s*["'`][a-z0-9-]+["'`]\s*\|/;
  const roleDefault = /\brole\s*:\s*\[\s*["'`][a-z0-9-]+["'`]\s*,\s*\{\s*option\s*:/;
  for (const file of files.support) {
    const content = read(file);
    if (roleList.test(content) || roleDefault.test(content)) {
      report.fail(file, "roles are written into code — read them from specs/project-map.md §Auth (authConfig().roles / defaultRole)");
    }
  }
}

function checkSweeps(files, report) {
  // Every disposable fixture has its sweep, or a run cut short leaves that data on the stand for good
  // (docs/test-strategy.md §6). The sweep list names the fixture it backs up.
  const dataFixtures = [at("src", "fixtures", "data.fixture.ts"), ...registeredPlatforms().map((app) => at("src", "fixtures", app, "data.fixture.ts"))].filter((file) => fs.existsSync(file));
  const sweepsFile = at("src", "data", "sweeps.ts");
  const sweeps = fs.existsSync(sweepsFile) ? read(sweepsFile) : "";
  for (const dataFixture of dataFixtures) {
    const disposables = new Set([...read(dataFixture).matchAll(/^\s+(disposable\w+)\s*:\s*async/gm)].map((m) => m[1]));
    for (const name of [...disposables].filter((fixture) => !sweeps.includes(fixture))) {
      report.fail(dataFixture, `${name} creates data that src/data/sweeps.ts does not sweep — add its entry, with ${name} named in a comment`);
    }
  }
  // Every sweep names its app from the first app on — a second app then changes no entry.
  if (registeredPlatforms().length && fs.existsSync(sweepsFile)) {
    const code = sweeps.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
    const labels = (code.match(/\blabel\s*:/g) ?? []).length;
    const named = (code.match(/\bplatform\s*:/g) ?? []).length;
    if (labels > named) report.fail(sweepsFile, `${labels - named} sweep entr${labels - named === 1 ? "y names" : "ies name"} no app — every entry says platform: "<app>" (the app whose API lists and deletes it)`);
  }
}

function checkMapBlocks(files, report) {
  // One ```auth / ```app-wide block per app: each `platform:` names an app the map lists, and no app
  // has two blocks of a kind (the second would be silently ignored).
  const map = at("specs", "project-map.md");
  if (!fs.existsSync(map)) return;
  const text = read(map).replace(/\r\n/g, "\n");
  const apps = registeredPlatforms();
  for (const kind of ["auth", "app-wide"]) {
    // A block of comments only is the template's example, not a block of an app.
    const owners = [...text.matchAll(new RegExp("```" + kind + "\\n([\\s\\S]*?)```", "g"))]
      .filter((m) => m[1].split("\n").some((line) => line.trim() && !line.trim().startsWith("#")))
      .map((m) => /^\s*platform:\s*(\S+)/m.exec(m[1])?.[1] ?? "(every app)");
    // From the first app on every block names its app, so a second app changes no block of the first.
    if (apps.length && owners.includes("(every app)")) report.fail(map, `a \`\`\`${kind} block without \`platform:\` — every block starts with platform: <app> (apps: ${apps.join(", ")})`);
    for (const owner of new Set(owners)) {
      if (owners.filter((other) => other === owner).length > 1) report.fail(map, `two \`\`\`${kind} blocks for ${owner} — keep one (a block per app, \`platform: <app>\`)`);
      if (owner !== "(every app)" && apps.length && !apps.includes(owner)) report.fail(map, `a \`\`\`${kind} block names app '${owner}', which §Apps and services does not list (apps: ${apps.join(", ")})`);
    }
  }
  // `sign-in like: <app>` borrows that app's own ```auth block — it must exist and the chain must end.
  const authBlocks = [...text.matchAll(/```auth\n([\s\S]*?)```/g)].map((m) => ({ owner: /^\s*platform:\s*(\S+)/m.exec(m[1])?.[1], like: /^\s*sign-in like:\s*(\S+)/m.exec(m[1])?.[1] }));
  for (const block of authBlocks.filter((entry) => entry.like)) {
    const chain = [block.owner];
    for (let next = block.like; next; next = authBlocks.find((entry) => entry.owner === next)?.like) {
      if (chain.includes(next)) {
        report.fail(map, `\`sign-in like:\` goes round in a circle (${[...chain, next].join(" → ")}) — one app writes the sign-in, the others point to it`);
        break;
      }
      if (!authBlocks.some((entry) => entry.owner === next)) {
        report.fail(map, `the \`\`\`auth block of ${block.owner ?? "(every app)"} signs in like '${next}', which has no \`\`\`auth block with \`platform: ${next}\``);
        break;
      }
      chain.push(next);
    }
  }
}

// Names the shared chain and Playwright already give every test. An app's fixture with one of them
// would replace it for that app's tests only — `page` without the background-error capture and the
// overlay handling, `authHeaders` without the app's sign-in — quietly.
const PLAYWRIGHT_FIXTURES = ["page", "context", "browser", "browserName", "request", "playwright", "baseURL", "storageState", "viewport", "headless", "channel", "launchOptions", "contextOptions", "connectOptions", "colorScheme", "locale", "timezoneId", "geolocation", "permissions", "extraHTTPHeaders", "httpCredentials", "ignoreHTTPSErrors", "isMobile", "javaScriptEnabled", "offline", "proxy", "screenshot", "trace", "video", "userAgent", "acceptDownloads", "bypassCSP", "deviceScaleFactor", "hasTouch", "serviceWorkers", "testIdAttribute", "actionTimeout", "navigationTimeout"];
const entriesOf = (text) => [...text.matchAll(/^ {2}(\w+)\s*:\s*(?:async|\[)/gm)].map((match) => match[1]);

function checkAppFixtureNames(files, report) {
  const shared = new Set([...PLAYWRIGHT_FIXTURES, ...CHAIN.flatMap((layer) => (fs.existsSync(at("src", "fixtures", `${layer}.fixture.ts`)) ? entriesOf(read(at("src", "fixtures", `${layer}.fixture.ts`))) : []))]);
  for (const app of registeredPlatforms()) {
    for (const kind of ["data", "pages"]) {
      const file = at("src", "fixtures", app, `${kind}.fixture.ts`);
      if (!fs.existsSync(file)) continue;
      for (const name of entriesOf(read(file)).filter((entry) => shared.has(entry))) {
        report.fail(file, `${app}'s fixture '${name}' replaces the shared '${name}' — ${app}'s tests would lose what the shared one does (sign-in, error capture, overlays, cleanup). Give it a name of its own`);
      }
    }
  }
}

export const supportRules = [checkFixtureChain, checkRolesFromMap, checkSweeps, checkMapBlocks, checkAppFixtureNames];
