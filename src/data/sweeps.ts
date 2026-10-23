import type { Sweep } from "../setup/sweep";

/**
 * What the sweep removes after an interrupted run (src/setup/sweep.ts runs it before and after
 * every run, `npm run data:sweep` alone): one entry per entity type the suite creates, with the
 * `disposable…` fixture of data.fixture.ts it backs up named in a comment — qa:gate fails a
 * disposable fixture this file does not name. A leftover is recognised by the AQA marker the
 * generators put in front of its name, so nothing else is ever touched. Empty until the first test
 * creates data.
 */
export const SWEEPS: Sweep[] = [
  // disposableItem
  // {
  //   label: "Item",
  //   platform: "crm", // the app whose API lists and deletes it
  //   listPath: "items",
  //   isLeftover: (item) => typeof item.name === "string" && item.name.startsWith("AQA "),
  //   deletePath: (item) => `items/${item.id}`,
  //   describe: (item) => item.name,
  // },
];
