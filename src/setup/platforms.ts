import { readMap } from "./map-block";

/**
 * The applications of this test home — the `Platform` column of specs/project-map.md §Apps and
 * services (crm, order-desk), each with the `.env` names of its web and API addresses.
 * From the first app on, everything is per app — one app or ten: its Playwright projects
 * (`ui:<app>`), its sign-in (an ```auth block with `platform: <app>`), its fixtures
 * (`src/fixtures/<app>/`), its folders, report label and tag. Adding an app adds files and
 * never changes another app's. Before the first app is set up the map holds the template's
 * `default` rows and the projects are plain `smoke`, `api`, `ui`, `e2e`.
 */
export interface Platform {
  slug: string;
  /** `.env` name of the web app's address (the table's UI row); none = the app has no web UI */
  ui?: string;
  /** `.env` name of the API's address (the table's API row); none = the app has no API of its own */
  api?: string;
}

const CLASSIC: Platform = { slug: "default", ui: "UI_BASE_URL", api: "API_BASE_URL" };

function readPlatforms(): Platform[] {
  const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(readMap() ?? "")?.[1] ?? "";
  const found = new Map<string, Platform>();
  for (const row of section.split("\n").filter((line) => line.startsWith("|"))) {
    const [slug, , kind, envCell] = row.split("|").slice(1).map((cell) => cell.trim());
    if (!slug || slug === "Platform" || /^-+$/.test(slug)) continue;
    const env = /`([A-Z0-9_]+)`/.exec(envCell ?? "")?.[1];
    const platform = found.get(slug) ?? { slug };
    if (env && /^ui\b/i.test(kind ?? "")) platform.ui ??= env;
    if (env && /^api\b/i.test(kind ?? "")) platform.api ??= env;
    found.set(slug, platform);
  }
  return found.size ? [...found.values()] : [CLASSIC];
}

let cached: Platform[] | undefined;

/** Every app of the test home, in the map's order. */
export const platforms = (): Platform[] => (cached ??= readPlatforms());

/** The map lists its apps (the first app is set up) — every per-app rule holds from here on. */
export const isRegistered = (): boolean => !platforms().every((platform) => platform.slug === CLASSIC.slug);

/** Several apps in one test home — only wording and the per-app reports depend on it. */
export const isMultiPlatform = (): boolean => platforms().length > 1;

/** The app a test belongs to when nothing says otherwise: the map's only — or first — app. */
export const defaultPlatform = (): string => platforms()[0].slug;

/** The app by its slug; a slug the map does not list is a readable error. */
export function platformOf(slug: string): Platform {
  const found = platforms().find((platform) => platform.slug === slug);
  if (!found) throw new Error(`App "${slug}" is not listed in specs/project-map.md §Apps and services (apps: ${platforms().map((p) => p.slug).join(", ")})`);
  return found;
}

/**
 * An app's address from .env — undefined when the app has none or it is not set yet (the test that needs it says so).
 * A web app under a path (`https://host/shop`) gets a trailing slash, so a relative address (`goto("./")`,
 * `goto("orders")`) stays under it; `.env` keeps the address as given, which the ```auth block's `${…}/path` lines need.
 */
export function urlOf(slug: string, kind: "ui" | "api"): string | undefined {
  const name = platformOf(slug)[kind];
  const value = name ? process.env[name]?.trim() : undefined;
  if (!value) return undefined;
  if (!/^https?:\/\/\S+$/.test(value)) throw new Error(`${name} in .env is not an http(s) address: "${value}"`);
  if (kind === "ui" && /^https?:\/\/[^/]+\/[^?#]*[^/?#]$/.test(value)) return `${value}/`;
  return value;
}

/** Says which .env entry is missing for an app's address — or that the app has no such address at all. */
export function missingUrl(slug: string, kind: "ui" | "api"): string {
  const name = platformOf(slug)[kind];
  const what = kind === "ui" ? "web app" : "API";
  const app = isMultiPlatform() ? ` of ${slug}` : "";
  return name
    ? `${name} is not set in .env — the address of the ${what}${app} (specs/project-map.md §Apps and services, .env.example)`
    : `The map lists no ${what}${app} (specs/project-map.md §Apps and services) — add its row with the .env name of its address`;
}
