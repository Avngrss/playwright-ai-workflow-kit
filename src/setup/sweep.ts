import { chromium, request, type APIRequestContext, type Browser } from "@playwright/test";
import { SWEEPS } from "../data/sweeps";
import { safeLogger } from "../logging/safe-logger.helper";
import { apiHeaders } from "./auth/auth";
import { authConfig } from "./auth/auth-config";
import { defaultPlatform, isRegistered, missingUrl, urlOf } from "./platforms";

/** One entity as the API lists it — its fields are the product's. */
export type Entity = Record<string, any>;

/** One kind of entity the suite creates, and how its leftovers are found and removed (src/data/sweeps.ts). */
export interface Sweep {
  /** What is swept, for the log ("Note"). */
  label: string;
  /** The app whose API lists and deletes it (`crm`) — every entry says it once the map lists its apps. */
  platform?: string;
  /** GET path, relative to the app's API address, that returns an array of the entities. */
  listPath: string;
  /** True only for entities this suite created — the AQA marker its generators put in the name. */
  isLeftover: (entity: Entity) => boolean;
  /** DELETE path for one entity. */
  deletePath: (entity: Entity) => string;
  /** One line naming the entity in the log. */
  describe: (entity: Entity) => string;
  /**
   * When the entity was made (epoch ms) — a field of its own (`Date.parse(item.createdAt)`), or the time
   * its AQA name carries (`timeInMarker(item.name)`). With it, an entity younger than
   * SWEEP_MIN_AGE_MINUTES is kept: another run may be using it right now. Without it, the run that
   * finds it removes it.
   */
  createdAt?: (entity: Entity) => number | undefined;
}

/** An AQA entity younger than this is kept — a parallel run (another worktree, another CI job) may still be using it. */
export const SWEEP_MIN_AGE_MINUTES = 30;

/**
 * The time an AQA name carries: a base-36 run of 12 characters or more whose first 8 are
 * `Date.now().toString(36)` (the time-and-random tail of a unique value); undefined when none reads as a
 * time between 2020 and tomorrow. Another long word can read as an earlier time ("kw…" as 2021), so the
 * latest one wins — a wrong reading then keeps an entity, never removes a young one.
 */
export function timeInMarker(text: unknown): number | undefined {
  if (typeof text !== "string") return undefined;
  const times = [...text.matchAll(/\b[0-9a-z]{12,}\b/g)]
    .map(([token]) => parseInt(token.slice(0, 8), 36))
    .filter((time) => time >= Date.UTC(2020, 0, 1) && time <= Date.now() + 86_400_000);
  return times.length ? Math.max(...times) : undefined;
}

/**
 * Removes the AQA-marked entities a run cut short left on the stand, through each app's API, signed
 * in as that app's default role the same way the tests are (src/setup/auth/). Only the apps of
 * the run (`apps`, every app when not given), and never an entity younger than SWEEP_MIN_AGE_MINUTES
 * when its entry says when it was made — so two runs at once never remove each other's data. Says
 * only what it removed or could not; nothing configured yet (SWEEPS empty) → does nothing.
 */
export async function sweepTestData(apps?: readonly string[]): Promise<void> {
  const sweeps = SWEEPS.filter((sweep) => !apps || apps.includes(platformOf(sweep)));
  if (sweeps.length === 0) return;
  let browser: Browser | undefined;
  const launch = async () => (browser ??= await chromium.launch());
  try {
    for (const platform of [...new Set(sweeps.map(platformOf))]) {
      const apiBase = urlOf(platform, "api");
      if (!apiBase) throw new Error(`${missingUrl(platform, "api")} — the sweep lists and deletes through the API`);
      const role = authConfig(platform).defaultRole;
      const headers = role === "none" ? {} : await apiHeaders(launch, { platform, role });
      const api = await request.newContext({ baseURL: `${apiBase.replace(/\/+$/, "")}/`, extraHTTPHeaders: headers, ignoreHTTPSErrors: true });
      try {
        for (const sweep of sweeps.filter((entry) => platformOf(entry) === platform)) await sweepOne(api, sweep);
      } finally {
        await api.dispose();
      }
    }
  } finally {
    await browser?.close();
  }
}

/** A sweep's app: its own `platform` — named from the first app on, so a second app changes no sweep. */
function platformOf(sweep: Sweep): string {
  if (sweep.platform) return sweep.platform;
  if (isRegistered()) throw new Error(`Sweep "${sweep.label}" names no platform — every entry of src/data/sweeps.ts says its app (platform: "<app>")`);
  return defaultPlatform();
}

async function sweepOne(api: APIRequestContext, sweep: Sweep): Promise<void> {
  const list = await api.get(sweep.listPath);
  const entities: unknown = list.ok() ? await list.json().catch(() => undefined) : undefined;
  if (!Array.isArray(entities)) {
    safeLogger.info(`[sweep] ${sweep.label}: could not list ${sweep.listPath} (http ${list.status()}) — skipped`);
    return;
  }
  for (const entity of (entities as Entity[]).filter(sweep.isLeftover)) {
    const created = sweep.createdAt?.(entity);
    if (created !== undefined && Date.now() - created < SWEEP_MIN_AGE_MINUTES * 60_000) {
      safeLogger.info(`[sweep] kept ${sweep.label}: ${sweep.describe(entity)} — made ${Math.round((Date.now() - created) / 60_000)} min ago, a run may still use it`);
      continue;
    }
    const removed = await api.delete(sweep.deletePath(entity));
    safeLogger.info(
      removed.ok()
        ? `[sweep] removed ${sweep.label}: ${sweep.describe(entity)}`
        : `[sweep] could not remove ${sweep.label}: ${sweep.describe(entity)} (http ${removed.status()})`,
    );
  }
}
