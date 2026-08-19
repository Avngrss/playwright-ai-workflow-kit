import { expect, test as base } from "@playwright/test";

/**
 * Foundation layer: Playwright test + expect only.
 * Do not add Page Objects, API clients, auth flows, or project fixtures here.
 */
export const test = base;

export { expect };
