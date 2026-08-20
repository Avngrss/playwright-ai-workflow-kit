/**
 * Public fixture entry point for specs.
 * Specs must import only from this file.
 *
 * Chain: base.fixture → api.fixture → data.fixture → pages.fixture → test.ts
 * Optional: reporting.fixture after base when readable Allure failure diagnostics are wired (first UI/API batch).
 * Optional later: auth.fixture as last layer before test.ts when auth wiring is needed.
 */
export { expect, test } from "./pages.fixture";
