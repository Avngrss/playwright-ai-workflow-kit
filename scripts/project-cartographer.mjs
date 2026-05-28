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

function isIgnored(name, isDirectory) {
  if (isDirectory && IGNORE_DIRS.has(name)) {
    return true;
  }

  if (!isDirectory && IGNORE_FILES.has(name)) {
    return true;
  }

  return false;
}

function listDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) {
      return -1;
    }

    if (!a.isDirectory() && b.isDirectory()) {
      return 1;
    }

    return a.name.localeCompare(b.name);
  });

  return entries;
}

function treeLines(dir, depth) {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const entries = listDir(dir).filter((entry) => {
    return !isIgnored(entry.name, entry.isDirectory());
  });

  const lines = [];
  const indent = "  ".repeat(depth);

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const isDirectory = entry.isDirectory();
    const marker = isDirectory ? "📁" : "📄";

    lines.push(`${indent}- ${marker} ${entry.name}${isDirectory ? "/" : ""}`);

    if (isDirectory && depth < MAX_DEPTH) {
      lines.push(...treeLines(full, depth + 1));
    }
  }

  return lines;
}

function replaceSection(content, newSection) {
  const startIndex = content.indexOf(START);
  const endIndex = content.indexOf(END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Project map markers not found or invalid in ${TARGET}`);
  }

  const before = content.slice(0, startIndex + START.length);
  const after = content.slice(endIndex);

  return `${before}\n\n${newSection}\n\n${after}`;
}

function main() {
  if (!fs.existsSync(TARGET)) {
    throw new Error(`Project map file not found: ${TARGET}`);
  }

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
