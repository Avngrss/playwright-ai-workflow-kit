import { Severity, LabelName } from "allure-js-commons";
import { allure } from "allure-playwright";

export type AllureMetadata = {
  feature?: string;
  story?: string;
  suite?: string;
  owner?: string;
  severity?: keyof typeof Severity;
  layer?: "ui" | "api" | "e2e";
  tags?: string[];
};

function toSeverity(value: keyof typeof Severity | undefined): Severity | undefined {
  if (!value) {
    return undefined;
  }

  return Severity[value];
}

export async function applyAllureMetadata(
  metadata: AllureMetadata,
): Promise<void> {
  if (metadata.feature) {
    await allure.feature(metadata.feature);
  }

  if (metadata.story) {
    await allure.story(metadata.story);
  }

  if (metadata.suite) {
    await allure.suite(metadata.suite);
  }

  if (metadata.owner) {
    await allure.owner(metadata.owner);
  }

  const severity = toSeverity(metadata.severity);
  if (severity) {
    await allure.severity(severity);
  }

  if (metadata.layer) {
    await allure.label(LabelName.LAYER, metadata.layer);
  }

  for (const tag of metadata.tags ?? []) {
    await allure.tag(tag);
  }
}
