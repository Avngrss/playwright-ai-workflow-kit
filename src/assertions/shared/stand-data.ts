/**
 * What a test stands on, missing on the stand: the failure names the item, what is wrong with it, why
 * the test needs it and where a person looks — so the report sorts it under "stand data", not a bug.
 */
export interface StandNeed {
  /** The stand's item, as a person finds it: `project "QA shop"`, `the account's workspaces`. */
  item: string;
  /** What is missing or wrong with it: "has no completed orders since its start". */
  problem: string;
  /** Why the test needs it, in one clause. */
  needed: string;
  /** Where a person looks on the stand to see it: "QA shop → Orders, Last 6 months". */
  checkByHand: string;
}

/** The error a lookup throws when the stand has no item it can use; its stack starts where it was called. */
export function standDataMissing({ item, problem, needed, checkByHand }: StandNeed, from: Function = standDataMissing): Error {
  const error = new Error(`Stand data: ${item} ${problem}\nNeeded: ${needed}\nCheck by hand: ${checkByHand}`);
  Error.captureStackTrace?.(error, from);
  return error;
}

/** A precondition the test asserts first — on the stand, not in the app under test. */
export function expectStandData(holds: unknown, need: StandNeed): asserts holds {
  if (!holds) throw standDataMissing(need, expectStandData);
}
