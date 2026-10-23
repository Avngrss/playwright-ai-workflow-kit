import dns from "node:dns";

/**
 * Opt-in (`AQA_SKIP_IPV6_LOOKUP=true` in .env): Playwright waits for both an IPv6 and an IPv4
 * lookup before each new connection, and a DNS server that is slow to answer IPv6 for an
 * IPv4-only stand (seen: ~11 s) makes every first request time out. Skipping the IPv6 lookup
 * leaves IPv4 only. Off by default — a stand with an IPv6 address needs it.
 */
export function skipIpv6LookupWhenAsked(): void {
  if (process.env.AQA_SKIP_IPV6_LOOKUP !== "true") return;
  const lookup = dns.promises.lookup.bind(dns.promises) as (host: string, options?: dns.LookupOptions) => Promise<unknown>;
  (dns.promises as { lookup: unknown }).lookup = (host: string, options: dns.LookupOptions = {}) =>
    options.family === 6
      ? Promise.reject(Object.assign(new Error(`IPv6 lookup skipped for ${host}`), { code: "ENOTFOUND" }))
      : lookup(host, options);
}
