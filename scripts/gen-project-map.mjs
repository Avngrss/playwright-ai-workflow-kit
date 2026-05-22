import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const TARGET = path.join(ROOT, ".cursor", "rules", "00-project-map.mdc");
const START = "<!-- PROJECT_MAP_START -->";
const END = "<!-- PROJECT_MAP_END -->";
const MAX_DEPTH = 4;

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "test-results",
  "playwright-report",
  ".playwright-mcp",
  ".vscode",
  "dist",
  "build",
  "coverage"
]);

const IGNORE_FILES = new Set([
  ".DS_Store"
]);

function isIgnored(fullPath, name, isDir) {
  if (isDir && IGNORE_DIRS.has(name)) return true;
  if (!isDir && IGNORE_FILES.has(name)) return true;
  return false;
}

function listDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

function treeLines(dir, depth, prefix = "") {
  if (depth > MAX_DEPTH) return [];

  const rel = path.relative(ROOT, dir) || ".";
  const entries = listDir(dir).filter(e => !isIgnored(path.join(dir, e.name), e.name, e.isDirectory()));

  const lines = [];
  const indent = "  ".repeat(depth);

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const isDir = entry.isDirectory();
    const marker = isDir ? "📁" : "📄";
    lines.push(`${indent}- ${marker} ${entry.name}${isDir ? "/" : ""}`);

    if (isDir && depth < MAX_DEPTH) {
      lines.push(...treeLines(full, depth + 1));
    }
  }

  return lines;
}

function replaceSection(content, newSection) {
  const startIdx = content.indexOf(START);
  const endIdx = content.indexOf(END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Markers not found or invalid in ${TARGET}`);
  }

  const before = content.slice(0, startIdx + START.length);
  const after = content.slice(endIdx);

  return `${before}\n\n${newSection}\n\n${after}`;
}

function main() {
  const current = fs.readFileSync(TARGET, "utf8");
  const header = `- ${path.basename(ROOT)}/`;
  const lines = [header, ...treeLines(ROOT, 1)];
  const newSection = lines.join("\n");

  const updated = replaceSection(current, newSection);

  if (updated !== current) {
    fs.writeFileSync(TARGET, updated, "utf8");
    console.log(`Updated ${path.relative(ROOT, TARGET)} (depth=${MAX_DEPTH})`);
  } else {
    console.log(`No changes in ${path.relative(ROOT, TARGET)}`);
  }
}

main();