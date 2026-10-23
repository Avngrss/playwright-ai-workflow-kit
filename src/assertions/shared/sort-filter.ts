import { expect } from "@playwright/test";
import { safeLogger } from "../../logging/safe-logger.helper";

/**
 * Sorting and filtering checks that prove the behaviour, not today's data
 * (.cursor/rules/code.mdc): the order of what is shown, or that every
 * shown item matches — never a fixed count or a fixed first row on data the test does not control.
 * A passing check prints what it inspected, so a green run shows it looked at real data.
 */

interface Verification {
  kind: "sort" | "filter";
  label: string;
  itemCount: number;
  checkedValues: string[];
}

export function logSortFilterVerification({ kind, label, itemCount, checkedValues }: Verification): void {
  const sample = checkedValues.slice(0, 5).join(", ");
  safeLogger.info(`[${kind}] ${label}: ${itemCount} item(s) checked — ${sample}${checkedValues.length > 5 ? ", …" : ""}`);
}

/**
 * The shown values are in order. Values come normalized by the caller — numbers for prices and
 * percentages, timestamps for dates, lower-cased strings for names. Equal neighbours are allowed
 * unless `strict`. A failure names the first pair out of order.
 */
export function expectSorted(values: Array<number | string>, label: string, direction: "asc" | "desc", options: { strict?: boolean } = {}): void {
  expect(values.length, `${label}: at least two items to compare`).toBeGreaterThan(1);
  const outOfOrder = values.findIndex((value, index) => {
    if (index === 0) return false;
    const previous = values[index - 1];
    if (value === previous) return Boolean(options.strict);
    return direction === "asc" ? value < previous : value > previous;
  });
  const pair = outOfOrder > 0 ? `${values[outOfOrder - 1]} → ${values[outOfOrder]} at position ${outOfOrder + 1}` : "none";
  expect(pair, `${label}: first pair out of ${direction} order`).toBe("none");
  logSortFilterVerification({ kind: "sort", label, itemCount: values.length, checkedValues: values.map(String) });
}

/** What every item must satisfy: the check's name, how a failure names an item, and the rule itself. */
interface ItemCheck<T> {
  label: string;
  name: (item: T) => string;
  matches: (item: T) => boolean;
}

/**
 * Every shown item satisfies the filter, and there is at least one (a negative case asserts the
 * empty state instead). A failure names the items that do not match.
 */
export function expectEveryItemMatches<T>(items: T[], { label, name, matches }: ItemCheck<T>): void {
  expect(items.length, `${label}: found items`).toBeGreaterThan(0);
  const misses = items.filter((item) => !matches(item)).map(name);
  expect(misses, `${label}: items that do not match`).toEqual([]);
  logSortFilterVerification({ kind: "filter", label, itemCount: items.length, checkedValues: items.map(name) });
}
