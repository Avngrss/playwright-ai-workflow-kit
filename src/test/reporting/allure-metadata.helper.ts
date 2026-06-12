import {
  feature,
  issue,
  owner,
  parentSuite,
  severity,
  story,
  subSuite,
  suite,
  tags,
  tms,
} from "allure-js-commons";

type AllureSeverity = "trivial" | "minor" | "normal" | "critical" | "blocker";

export type AllureMetadata = {
  parentSuite?: string;
  suite?: string;
  subSuite?: string;
  feature?: string;
  story?: string;
  owner?: string;
  severity?: AllureSeverity;
  issue?: string;
  tms?: string;
  tags?: string[];
};

export async function applyAllureMetadata(
  metadata: AllureMetadata,
): Promise<void> {
  if (metadata.parentSuite) {
    await parentSuite(metadata.parentSuite);
  }

  if (metadata.suite) {
    await suite(metadata.suite);
  }

  if (metadata.subSuite) {
    await subSuite(metadata.subSuite);
  }

  if (metadata.feature) {
    await feature(metadata.feature);
  }

  if (metadata.story) {
    await story(metadata.story);
  }

  if (metadata.owner) {
    await owner(metadata.owner);
  }

  if (metadata.severity) {
    await severity(metadata.severity);
  }

  if (metadata.issue) {
    await issue(metadata.issue);
  }

  if (metadata.tms) {
    await tms(metadata.tms);
  }

  if (metadata.tags?.length) {
    await tags(...metadata.tags);
  }
}
