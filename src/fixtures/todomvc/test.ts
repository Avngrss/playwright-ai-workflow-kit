import { caseLinksOf } from "../../reporting/tms";

// What todomvc's specs import: the shared chain plus todomvc's own fixtures, and the links to its cases.
export { expect, test } from "./pages.fixture";

/** `const tms = caseLinks(<folder>)` once in a spec, then `annotation: tms(101)` — the URL comes from the map. */
export const caseLinks = (folder?: string | number) => caseLinksOf("todomvc", folder);
