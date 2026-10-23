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
}

/**
 * Removes the AQA-marked entities a run cut short left on the stand, through each app's API, signed
 * in as that app's default role the same way the tests are (src/setup/auth/). Says only what it
 * removed or could not; nothing configured yet (SWEEPS empty) → does nothing.
 */
export async function sweepTestData(): Promise<void> {
  if (SWEEPS.length === 0) return;
  let browser: Browser | undefined;
  const launch = async () => (browser ??= await chromium.launch());
  try {
    for (const platform of [...new Set(SWEEPS.map(platformOf))]) {
      const apiBase = urlOf(platform, "api");
      if (!apiBase) throw new Error(`${missingUrl(platform, "api")} — the sweep lists and deletes through the API`);
      const role = authConfig(platform).defaultRole;
      const headers = role === "none" ? {} : await apiHeaders(launch, { platform, role });
      const api = await request.newContext({ baseURL: `${apiBase.replace(/\/+$/, "")}/`, extraHTTPHeaders: headers, ignoreHTTPSErrors: true });
      try {
        for (const sweep of SWEEPS.filter((entry) => platformOf(entry) === platform)) await sweepOne(api, sweep);
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
    const removed = await api.delete(sweep.deletePath(entity));
    safeLogger.info(
      removed.ok()
        ? `[sweep] removed ${sweep.label}: ${sweep.describe(entity)}`
        : `[sweep] could not remove ${sweep.label}: ${sweep.describe(entity)} (http ${removed.status()})`,
    );
  }
}
