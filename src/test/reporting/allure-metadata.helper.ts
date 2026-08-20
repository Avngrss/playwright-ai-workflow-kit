import * as allure from "allure-js-commons";
import { ContentType } from "allure-js-commons";

export type AllureSeverity =
  | "blocker"
  | "critical"
  | "normal"
  | "minor"
  | "trivial";

export type AllureLinkInput =
  | string
  | {
      url: string;
      name?: string;
    };

export type AllureMetadata = {
  feature?: string;
  story?: string;
  suite?: string;
  parentSuite?: string;
  subSuite?: string;
  layer?: string;
  severity?: AllureSeverity;
  owner?: string;
  component?: string;
  epic?: string;
  tags?: readonly string[];
  issue?: AllureLinkInput;
  tms?: AllureLinkInput;
  browser?: string;
  viewport?: string;
  description?: string;
};

function normalizeSeverity(value: AllureSeverity): string {
  return value.toLowerCase();
}

function resolveLink(input: AllureLinkInput): { url: string; name?: string } {
  if (typeof input === "string") {
    return { url: input };
  }

  return input;
}

export function buildAllureSuitePath(
  rootSuite: string,
  ...segments: string[]
): string {
  return [rootSuite, ...segments.filter((segment) => segment.trim().length > 0)].join(
    " / ",
  );
}

export async function applyAllureMetadata(metadata: AllureMetadata): Promise<void> {
  const tasks: Array<PromiseLike<void>> = [];

  if (metadata.epic) {
    tasks.push(allure.epic(metadata.epic));
  }

  if (metadata.feature) {
    tasks.push(allure.feature(metadata.feature));
  }

  if (metadata.story) {
    tasks.push(allure.story(metadata.story));
  }

  if (metadata.parentSuite) {
    tasks.push(allure.parentSuite(metadata.parentSuite));
  }

  if (metadata.suite) {
    tasks.push(allure.suite(metadata.suite));
  }

  if (metadata.subSuite) {
    tasks.push(allure.subSuite(metadata.subSuite));
  }

  if (metadata.layer) {
    tasks.push(allure.layer(metadata.layer));
  }

  if (metadata.owner) {
    tasks.push(allure.owner(metadata.owner));
  }

  if (metadata.severity) {
    tasks.push(allure.severity(normalizeSeverity(metadata.severity)));
  }

  if (metadata.component) {
    tasks.push(allure.label("component", metadata.component));
  }

  if (metadata.browser) {
    tasks.push(allure.parameter("browser", metadata.browser, { mode: "default" }));
  }

  if (metadata.viewport) {
    tasks.push(allure.parameter("viewport", metadata.viewport, { mode: "default" }));
  }

  if (metadata.description) {
    tasks.push(allure.description(metadata.description));
  }

  if (metadata.tags && metadata.tags.length > 0) {
    tasks.push(allure.tags(...metadata.tags));
  }

  if (metadata.issue) {
    const issue = resolveLink(metadata.issue);
    tasks.push(allure.issue(issue.url, issue.name));
  }

  if (metadata.tms) {
    const tmsLink = resolveLink(metadata.tms);
    tasks.push(allure.tms(tmsLink.url, tmsLink.name));
  }

  await Promise.all(tasks);
}

export async function attachReadableTextAttachment(
  name: string,
  content: string,
): Promise<void> {
  await allure.attachment(name, content, ContentType.TEXT);
}
