/**
 * A test's Severity from its plan case, as the annotation the report reads (report-tree.ts):
 * `{ tag: ["@api", "@regression"], annotation: severity.critical }`.
 */
export const severity = {
  critical: { type: "severity", description: "critical" },
  major: { type: "severity", description: "major" },
  minor: { type: "severity", description: "minor" },
} as const;
