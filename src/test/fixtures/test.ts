/**
 * Public fixture entry point for specs.
 * Specs must import only from this file.
 *
 * Chain: base.fixture → api.fixture → data.fixture → pages.fixture → test.ts
 * Optional later: auth.fixture as last layer before test.ts when auth wiring is needed.
 */
export { expect, test } from "./pages.fixture";
