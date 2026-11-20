import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** The OS cache Playwright keeps its browsers in when PLAYWRIGHT_BROWSERS_PATH is not set. */
function osCache(): string {
  if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "ms-playwright");
  if (process.platform === "darwin") return path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  return path.join(process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache"), "ms-playwright");
}

/** The Chromium builds this Playwright runs (`chromium-1248`, `chromium_headless_shell-1248`), from playwright-core's browsers.json; none when unreadable. */
function requiredBuilds(): string[] {
  try {
    const core = path.dirname(require.resolve("playwright-core/package.json"));
    const { browsers } = JSON.parse(fs.readFileSync(path.join(core, "browsers.json"), "utf8")) as { browsers: Array<{ name: string; revision: string }> };
    return browsers.filter(({ name }) => name === "chromium" || name === "chromium-headless-shell").map(({ name, revision }) => `${name.replace(/-/g, "_")}-${revision}`);
  } catch {
    return [];
  }
}

/**
 * An agent's sandbox (Cursor's) points PLAYWRIGHT_BROWSERS_PATH at an empty Temp\cursor-sandbox-cache folder. When
 * this Playwright's Chromium is in the OS cache and not in that folder, the run uses the OS cache's — as
 * scripts/run-tests.mjs does on install; when the OS cache lacks it, the sandbox folder (where it was installed) stays.
 */
export function preferOsCacheOverSandbox(): void {
  const set = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!set?.includes("cursor-sandbox-cache")) return;
  const builds = requiredBuilds();
  const holds = (dir: string) => builds.length > 0 && builds.every((build) => fs.existsSync(path.join(dir, build)));
  if (!holds(set) && holds(osCache())) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
}
