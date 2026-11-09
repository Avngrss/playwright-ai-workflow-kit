import { zoneAndLocaleOf } from "../../setup/app-wide";

/**
 * Dates and numbers as an app's pages show them: in the time zone and language its browser runs in (the
 * map's ```app-wide `timezone:` / `locale:`; UTC and en-US without them — playwright.config.ts gives the
 * browser the same). An app's display helpers (src/assertions/<app>/display.ts) build each block's
 * expected text with these, matched to what the page shows live — never `toLocale…String()` without a
 * zone and language, which follow the machine running the tests.
 *
 *   shownDate = (value: string) => dateAsShown("shop", value, { day: "numeric", month: "short", year: "numeric" })
 */
export function dateAsShown(platform: string, value: Date | number | string, format: Intl.DateTimeFormatOptions): string {
  const { timezoneId, locale } = zoneAndLocaleOf(platform);
  return new Intl.DateTimeFormat(locale, { ...format, timeZone: timezoneId }).format(new Date(value));
}

/** A number, an amount or a percentage as the app's pages show it: `numberAsShown("shop", 1234.5, { style: "currency", currency: "EUR" })`. */
export function numberAsShown(platform: string, value: number, format: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(zoneAndLocaleOf(platform).locale, format).format(value);
}
