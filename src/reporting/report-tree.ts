import fs from "node:fs";
import path from "node:path";

/**
 * Report tree — four levels, so a large suite stays navigable:
 *   <Platform> › <Area> › <Feature> › API | UI › <test>      (the plan spells the area and feature)
 *   <Platform> › Smoke · is the stand alive › Sign-in › <test>   (the template's sign-in check)
 *   <Platform> › Smoke · is the stand alive › <Area> › <Feature> › <test>   (a feature's smoke test, in a
 *                                                              smoke run; in a regression run it stays in its feature)
 *   <Platform> › User journeys (E2E) › <Area> › <test>
 * Derived from where the spec lives (the folder scheme the gate enforces) and applied by the
 * reporter, so a test that fails before its body (a missing login, a stand timeout) still lands in
 * its place. Nothing is typed per spec.
 */

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const humanize = (slug: string): string => {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** "# Header — Global search (…)" in the feature's plan → "Header › Global search". */
function planTitle(...planPath: string[]): string | undefined {
  const file = path.join(PROJECT_ROOT, "specs", ...planPath);
  if (!fs.existsSync(file)) return undefined;
  const heading = fs.readFileSync(file, "utf8").split(/\r?\n/, 1)[0] ?? "";
  const title = heading.replace(/^#\s*/, "").replace(/\s*\(.*\)\s*$/, "").trim();
  return title ? title.replace(/\s+—\s+/g, " › ") : undefined;
}

/** The area's name as its plans spell it ("Account"); falls back to the folder name. */
function areaTitle(platform: string, area: string): string {
  const areaDir = path.join(PROJECT_ROOT, "specs", platform, area);
  const features = fs.existsSync(areaDir) ? fs.readdirSync(areaDir) : [];
  for (const feature of features) {
    const title = planTitle(platform, area, feature, `${feature}.md`);
    if (title?.includes(" › ")) return title.split(" › ")[0];
  }
  return humanize(area);
}

// The app as the tree names it: short words are acronyms — crm → CRM, order-desk → Order Desk.
const epicOf = (platform: string) =>
  platform
    .split("-")
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");

/**
 * A smoke run — `npm run test:smoke`, `npm run test:app -- <app> smoke`, any run with `--grep @smoke`.
 * Its report gathers every test under Smoke; a regression run keeps a feature's smoke test in its feature.
 */
const smokeRun = (() => {
  const at = process.argv.findIndex((arg) => arg === "--grep" || arg === "-g");
  const grep = at >= 0 ? process.argv[at + 1] : process.argv.find((arg) => arg.startsWith("--grep="))?.slice("--grep=".length);
  return grep?.replace(/^["']|["']$/g, "") === "@smoke";
})();

function groupingOf(file: string, app?: string, tags: readonly string[] = []): Record<string, string | undefined> {
  const segments = file.split(path.sep);
  const testsIndex = segments.lastIndexOf("tests");
  if (testsIndex === -1) return {};

  const [layer, platform, area, feature] = segments.slice(testsIndex + 1);
  const smoke = "Smoke · is the stand alive";
  // tests/smoke/sign-in.smoke.spec.ts, the only smoke file — it runs once per app, under the app of its project
  if (layer === "smoke") return { epic: app && app !== "default" ? epicOf(app) : undefined, feature: smoke, story: "Sign-in" };

  const epic = epicOf(platform);
  if (layer === "e2e") {
    return { epic, feature: "User journeys (E2E)", story: areaTitle(platform, area) };
  }
  const planned = planTitle(platform, area, feature, `${feature}.md`);
  const featureTitle = planned?.includes(" › ") ? planned.split(" › ").slice(1).join(" › ") : humanize(feature);
  // A feature's smoke test, in a smoke run: under Smoke, next to the sign-in check, by its area and feature.
  if (smokeRun && tags.includes("@smoke")) return { epic, feature: smoke, story: `${areaTitle(platform, area)} › ${featureTitle}`, layer: layer.toUpperCase() };
  return { epic, feature: areaTitle(platform, area), story: featureTitle, layer: layer.toUpperCase() };
}

/**
 * The case's Severity from the plan — `{ annotation: { type: "severity", description: "critical" |
 * "major" | "minor" } }` ("major" is Allure's "normal"); tests without it fall back to the tag.
 */
function severityOf(annotations: Array<{ type: string; description?: string }>, tags: readonly string[]): string | undefined {
  const declared = annotations.find((annotation) => annotation.type === "severity")?.description?.toLowerCase();
  if (declared === "critical" || declared === "minor") return declared;
  if (declared === "major" || declared === "normal") return "normal";
  if (tags.includes("@smoke")) return "critical";
  if (tags.includes("@regression")) return "normal";
  return undefined;
}

/**
 * The labels a test gets in the report: its place in the tree, its severity, and — from its project
 * (playwright.config.ts) — its app: a `platform` label (each app's own report is filtered by it,
 * allurerc.mjs) and the app as a tag, so a mixed report can be filtered by app.
 */
export function reportLabels(
  file: string,
  annotations: Array<{ type: string; description?: string }>,
  tags: readonly string[],
  platform?: string,
): Array<{ name: string; value: string }> {
  const labels = Object.entries({ ...groupingOf(file, platform, tags), severity: severityOf(annotations, tags) })
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => ({ name, value }));
  if (!platform) return labels;
  return [...labels, { name: "platform", value: platform }, ...(platform === "default" ? [] : [{ name: "tag", value: platform }])];
}
