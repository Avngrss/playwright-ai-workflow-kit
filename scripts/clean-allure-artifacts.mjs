import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_DIR = path.join(ROOT, "reports/allure/results");
const HTML_DIR = path.join(ROOT, "reports/allure/html");

function emptyDirectory(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created ${label}: ${path.relative(ROOT, dirPath)}`);
    return 0;
  }

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    fs.rmSync(path.join(dirPath, entry), { recursive: true, force: true });
  }

  console.log(
    `Cleaned ${label}: removed ${entries.length} item(s) from ${path.relative(ROOT, dirPath)}`,
  );
  return entries.length;
}

const flags = new Set(process.argv.slice(2));
const cleanResults =
  flags.size === 0 || flags.has("--all") || flags.has("--results");
const cleanHtml = flags.size === 0 || flags.has("--all") || flags.has("--html");

if (flags.has("--help") || flags.has("-h")) {
  console.log(`Usage: node scripts/clean-allure-artifacts.mjs [options]

Options:
  --results   Remove raw Allure results (reports/allure/results)
  --html      Remove generated Allure HTML (reports/allure/html)
  --all       Remove both folders (default when no flags are passed)

Examples:
  node scripts/clean-allure-artifacts.mjs --results
  node scripts/clean-allure-artifacts.mjs --html
  node scripts/clean-allure-artifacts.mjs --all`);
  process.exit(0);
}

if (cleanResults) {
  emptyDirectory(RESULTS_DIR, "Allure results");
}

if (cleanHtml) {
  emptyDirectory(HTML_DIR, "Allure HTML");
}
