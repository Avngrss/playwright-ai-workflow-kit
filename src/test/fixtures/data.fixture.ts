import { expect, test as base } from "./api.fixture";

/**
 * Test data layer (builders, generators, datasets wired as fixtures).
 * Extend here when reusable data fixtures are needed across specs.
 *
 * Example (when justified):
 * export const test = base.extend<{ userBuilder: UserBuilder }>({ ... });
 */
export const test = base.extend({});

export { expect };
