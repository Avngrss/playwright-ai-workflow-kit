import { expect, test as base } from "./base.fixture";

/**
 * API transport / setup layer.
 * Extend here when API preconditions or shared request context are needed.
 *
 * Example (when justified):
 * export const test = base.extend<{ apiSetup: ApiSetup }>({ ... });
 */
export const test = base.extend({});

export { expect };
