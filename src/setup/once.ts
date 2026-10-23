import { checkSharedItems } from "./shared-state";

/**
 * A lookup on the stand done once per worker — the item the tests of a feature stand on, found by its
 * own requests (setup/<app>/): the first test finds it, the others reuse what it found — a miss too,
 * with its message — instead of scanning the stand again. The key names what is found, for which app
 * and role. Keep what does not change during the run (an id, a name); a test that changes the item
 * reads it again. What it finds is checked for every test that takes it: an item other tests change
 * needs their lock (shared-state.ts).
 */
const found = new Map<string, Promise<unknown>>();

export async function oncePerWorker<T>(key: string, find: () => Promise<T>): Promise<T> {
  if (!found.has(key)) found.set(key, find());
  const item = (await found.get(key)) as T;
  checkSharedItems(`The lookup "${key}"`, item);
  return item;
}
