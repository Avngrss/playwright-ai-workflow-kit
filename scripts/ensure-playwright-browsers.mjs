import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function shouldSkipBrowserBootstrap() {
  if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1") {
    return "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1";
  }

  // CI installs browsers explicitly in the workflow matrix step.
  if (process.env.CI === "true") {
    return "CI=true";
  }

  return undefined;
}

function resolveBrowsersDirectory() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    return process.env.PLAYWRIGHT_BROWSERS_PATH;
  }

  const localAppData =
    process.env.LOCALAPPDATA ??
    path.join(os.homedir(), process.platform === "win32" ? "AppData/Local" : ".cache");

  return path.join(localAppData, "ms-playwright");
}

function hasChromiumRuntime(browsersDirectory) {
  if (!fs.existsSync(browsersDirectory)) {
    return false;
  }

  return fs
    .readdirSync(browsersDirectory)
    .some(
      (entry) =>
        entry.startsWith("chromium-") ||
        entry.startsWith("chromium_headless_shell-"),
    );
}

function installChromium() {
  const browsersDirectory = resolveBrowsersDirectory();
  const sandboxPath = process.env.PLAYWRIGHT_BROWSERS_PATH?.includes(
    "cursor-sandbox-cache",
  );

  console.info(
    sandboxPath
      ? "Cursor sandbox browser path is empty. Installing Chromium for this session..."
      : `Playwright Chromium is missing in ${browsersDirectory}. Installing...`,
  );

  execSync("npx playwright install chromium", {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (!hasChromiumRuntime(browsersDirectory)) {
    console.error(
      "Playwright Chromium is still missing after install. Run manually: npm run browsers:install",
    );
    process.exit(1);
  }
}

const skipReason = shouldSkipBrowserBootstrap();
if (skipReason) {
  process.exit(0);
}

const browsersDirectory = resolveBrowsersDirectory();

if (hasChromiumRuntime(browsersDirectory)) {
  process.exit(0);
}

installChromium();
