import fs from "node:fs";
import path from "node:path";

/**
 * specs/known-bugs.md — the tests that fail on a bug confirmed by hand and filed. The run marks each one
 * itself (fixtures/reporting.fixture.ts): grey while it fails at its step, red once it passes. A row is
 * added when the ticket exists and removed when the ticket is retested and closed.
 */
export const KNOWN_BUGS_FILE = path.resolve(__dirname, "..", "..", "specs", "known-bugs.md");

export interface KnownBug {
  /** The test's full title, or the case id its title starts with ("TC-101"). */
  test: string;
  /** api, ui or e2e — the layer the row's test runs in. */
  layer: string;
  ticket: string;
  /** The step the bug fails, as the test titles it. */
  step: string;
  since: string;
  /** The ticket's address, from the file's `ticket link:` line. */
  url?: string;
}

const cellsOf = (line: string): string[] =>
  line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim().replace(/^`|`$/g, ""));

export function knownBugs(): KnownBug[] {
  if (!fs.existsSync(KNOWN_BUGS_FILE)) return [];
  const text = fs.readFileSync(KNOWN_BUGS_FILE, "utf8").replace(/\r\n/g, "\n");
  const link = /^- ticket link:\s*(\S+)/m.exec(text)?.[1];
  const rows = text
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map(cellsOf)
    .filter(([test]) => test && test !== "Test" && !/^-+$/.test(test));
  return rows.map(([test, layer, ticket, step, since]) => ({
    test,
    layer: layer.toLowerCase(),
    ticket,
    step,
    since,
    url: link?.includes("{id}") ? link.replace("{id}", ticket) : undefined,
  }));
}

/** The known bug a test is marked with — its row names the test (its title or its case id) and its layer. */
export function knownBugOf(title: string, layer: string): KnownBug | undefined {
  return knownBugs().find((bug) => bug.layer === layer && (title === bug.test || title.startsWith(`${bug.test} · `)));
}
