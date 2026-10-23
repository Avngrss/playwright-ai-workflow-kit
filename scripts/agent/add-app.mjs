/**
 * Gives an app of the map its own fixtures: src/fixtures/<app>/data.fixture.ts (its data and
 * bound clients), pages.fixture.ts (its Page Objects) and test.ts — the `test` its specs import. They
 * sit on top of the shared chain (src/fixtures/test.ts), so another app's tests never see them
 * and a mistake in them never stops another app's tests from loading. The setup skill runs it when it
 * sets an app up; a file that exists is left as it is, and no other app's file is touched.
 *
 *   npm run app:add -- <app>
 */
import fs from "node:fs";
import path from "node:path";

const app = process.argv[2];
const root = process.cwd();

if (!app || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(app)) {
  console.error("Name the app as the map's Platform column does (kebab-case): npm run app:add -- <app>");
  process.exit(1);
}

const map = fs.existsSync(path.join(root, "specs", "project-map.md")) ? fs.readFileSync(path.join(root, "specs", "project-map.md"), "utf8").replace(/\r\n/g, "\n") : "";
const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(map)?.[1] ?? "";
const listed = section.split("\n").filter((line) => line.startsWith("|")).map((line) => line.split("|")[1]?.trim());
if (!listed.includes(app)) {
  console.error(`App "${app}" is not in specs/project-map.md §Apps and services — add its rows there first (Platform: ${app})`);
  process.exit(1);
}

const files = {
  "data.fixture.ts": `import { expect, test as base } from "../test";

/**
 * ${app}'s test data — bound clients of the signed-in role and disposable data (created before the
 * test, removed after) that its specs need without testing them. Only ${app}'s tests see these; the
 * shared chain under src/fixtures/ is the template's and never edited.
 */
export const test = base.extend({});

export { expect };
`,
  "pages.fixture.ts": `import { expect, test as base } from "./data.fixture";

/** ${app}'s Page Objects — one fixture per page its tests open, built on \`page\`. */
export const test = base.extend({});

export { expect };
`,
  "test.ts": `import { caseLinksOf } from "../../reporting/tms";

// What ${app}'s specs import: the shared chain plus ${app}'s own fixtures, and the links to its cases.
export { expect, test } from "./pages.fixture";

/** \`const tms = caseLinks(<folder>)\` once in a spec, then \`annotation: tms(101)\` — the URL comes from the map. */
export const caseLinks = (folder?: string | number) => caseLinksOf("${app}", folder);
`,
};

const dir = path.join(root, "src", "fixtures", app);
fs.mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  const file = path.join(dir, name);
  if (fs.existsSync(file)) {
    console.log(`= src/fixtures/${app}/${name} (kept)`);
    continue;
  }
  fs.writeFileSync(file, content);
  console.log(`+ src/fixtures/${app}/${name}`);
}
console.log(`${app}'s specs import { test, expect } from "src/fixtures/${app}/test".`);
