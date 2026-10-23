import path from "node:path";

/**
 * Turns a raw Playwright error into what a reader of the report needs: what was checked, what was
 * expected, what happened, where. The full call log stays in the trace and the Playwright HTML
 * report; the Allure report shows only this.
 */

// Sign-in redirects carry one-time codes and tokens in the URL — never shown in a shared report.
const SECRET_PARAMS = /([?&#](?:code|state|session_state|nonce|token|access_token|id_token|refresh_token|password)=)[^&#\s'"]+/gi;
const ANSI = /\u001b\[[0-9;]*m/g;
// A long received value is shown by its shape, not its data — whole API payloads carry personal data.
const MAX_VALUE_LENGTH = 200;

const ACTION_TIMEOUT: Record<string, string> = {
  click: "Could not click the element",
  dblclick: "Could not double-click the element",
  fill: "Could not type into the element",
  check: "Could not tick the element",
  uncheck: "Could not untick the element",
  hover: "Could not hover the element",
  selectOption: "Could not select in the element",
  press: "Could not press a key in the element",
  waitFor: "The element did not appear",
  goto: "The page did not open",
};

const seconds = (ms: string): string => `${Number(ms) / 1000} s`;

/** A long received object/array → its shape ("3 items", "object with fields: id, level"), not its data. */
function shapeOf(value: string): string {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return `${parsed.length} item${parsed.length === 1 ? "" : "s"}`;
    if (parsed && typeof parsed === "object") return `object with fields: ${Object.keys(parsed).join(", ")}`;
  } catch {
    // Not JSON (a long string, a DOM dump) — cut instead.
  }
  return `${value.slice(0, MAX_VALUE_LENGTH)} …`;
}

export function maskSecrets(text: string): string {
  return text.replace(SECRET_PARAMS, "$1***");
}

/** What the call log knows that the message does not: the element waited for, the request sent. */
function callLogFacts(message: string): string[] {
  const log = message.split(/\n\s*Call log:/)[1] ?? "";
  const element = log.match(/waiting for (.+)$/m)?.[1]?.replace(/ to be (?:visible|hidden|attached|detached)$/, "").trim();
  const request = log.match(/→ (GET|POST|PUT|PATCH|DELETE) (\S+)/);
  return [
    ...(element ? [`Element: ${element}`] : []),
    ...(request ? [`Request: ${request[1]} ${request[2]}`] : []),
  ];
}

/** Playwright's code-form headlines → plain sentences. */
function plainHeadline(text: string): string {
  return text
    .replace(/^(?:TimeoutError: )?(?:locator|page|frame)\.(\w+): (?:Test timeout of|Timeout) (\d+)ms exceeded\.?/m,
      (_, action: string, ms: string) => `${ACTION_TIMEOUT[action] ?? `${action} did not finish`} within ${seconds(ms)}`)
    .replace(/^Test timeout of (\d+)ms exceeded\.?/m, (_, ms: string) => `The test ran out of time (limit ${seconds(ms)})`)
    .replace(/^(?:\w+Error: )?apiRequestContext\.\w+: connect ECONNREFUSED (\S+)/m, "Could not reach $1: connection refused")
    .replace(/^(?:\w+Error: )?apiRequestContext\.\w+: getaddrinfo ENOTFOUND (\S+)/m, "Could not reach $1: host not found")
    .replace(/^(?:\w+Error: )?apiRequestContext\.\w+: Timeout (\d+)ms exceeded\.?/m, (_, ms: string) => `No answer within ${seconds(ms)}`);
}

/**
 * "Error: …\n\nCall log:\n  - …" → the message without the call log, masked, tidy. When the
 * assertion names what it checks (expect(x, "Order row \"#1042\"")), that name leads and the
 * matcher line and raw selector — the same fact in code form — are dropped.
 */
export function readableMessage(message: string): string {
  const raw = message.replace(ANSI, "");
  let text = plainHeadline(raw.replace(/\n\s*Call log:[\s\S]*$/, "").replace(/^Error:\s*/, ""))
    .replace(/^Timeout:\s+(\d+)ms$/m, (_, ms: string) => `Waited: ${seconds(ms)}`)
    .replace(/^Error: element\(s\) not found$/m, "Received: not found on the page")
    .replace(/^(Received [\w ]+:\s+)(.{200,})$/gm, (_, label: string, value: string) => `${label}${shapeOf(value)}`);

  const named = !/^expect\(/.test(text);
  if (named) {
    text = text
      .replace(/^expect\(.*\)\.\w+\(.*\)(?: failed)?(?: \/\/.*)?$/m, "")
      .replace(/^Locator: .*(?:locator\(|getBy).*$/m, "");
  }
  // The element is named only when nothing else names it: an action or a wait, not an assertion.
  const facts = callLogFacts(raw).filter((fact) => !(fact.startsWith("Element:") && /^(?:Locator|Expected)\b/m.test(text)));
  if (facts.length) text += `\n${facts.join("\n")}`;

  // Expected → Received → Waited reads as a sentence; Playwright prints the timeout in between.
  const waited = text.match(/^Waited: .*$/m)?.[0];
  if (waited && /^Received/m.test(text)) {
    text = text.replace(/^Waited: .*\n?/m, "").replace(/^(Received.*)$/m, `$1\n${waited}`);
  }
  return maskSecrets(text)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\n(?=(?:Expected|Received|Waited|Element|Request)\b)/g, "\n")
    .trim();
}

/** First line only — what a failed step shows, so the full text is not repeated under every step. */
export function headline(message: string): string {
  return readableMessage(message).split("\n", 1)[0];
}

/** Stack → only the lines in this repo's own code ("at … (src/…/page.ts:42:5)"), plus the code snippet. */
export function readableTrace(stack: string | undefined, snippet: string | undefined): string | undefined {
  const ownFrames = (stack ?? "")
    .replace(ANSI, "")
    .split("\n")
    .filter((line) => /^\s+at /.test(line) && !line.includes("node_modules"))
    .map((line) => line.replace(process.cwd() + path.sep, "").trim());
  const parts = [snippet?.replace(ANSI, ""), ownFrames.join("\n")].filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}
