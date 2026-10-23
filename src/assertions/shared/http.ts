import { expect, type APIResponse } from "@playwright/test";

/**
 * A response whose JSON body type its client declares (`request.get(…) as Promise<JsonResponse<T>>`),
 * so `expectJson` knows the body type and specs never repeat `expectJson<T>(…)`.
 */
export type JsonResponse<T> = APIResponse & { readonly __body?: T };

/** A client's call with its body type: `profile: () => json<UserProfile>(request.get("api/userProfile", { headers }))`. */
export const json = <T>(response: Promise<APIResponse>): Promise<JsonResponse<T>> => response as Promise<JsonResponse<T>>;

/** An unexpected 401/403 says whether the session or the rights are the problem, with the server's reason. */
function signInHint(res: APIResponse, expected: number): string {
  if (res.status() === expected) return "";
  const reason = res.headers()["www-authenticate"];
  if (res.status() === 401) return ` — the API did not accept the session${reason ? ` (${reason})` : ""}: check the login setup (specs/project-map.md §Auth)`;
  if (res.status() === 403) return " — the session is accepted, but this user has no rights for it";
  return "";
}

/** Asserts the status (200 unless named) and returns the parsed body; a mismatch says which endpoint answered what, with the body. */
export async function expectJson<T = unknown>(response: JsonResponse<T> | Promise<JsonResponse<T>>, status = 200): Promise<T> {
  const text = await checkStatus(await response, status);
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Same check for a response whose body is not read — it may be a file (a PDF export), not JSON. */
export async function expectStatus(response: APIResponse | Promise<APIResponse>, status: number): Promise<void> {
  await checkStatus(await response, status);
}

async function checkStatus(res: APIResponse, status: number): Promise<string> {
  const text = await res.text();
  const endpoint = new URL(res.url()).pathname;
  const body = text.length > 300 ? `${text.slice(0, 300)} …` : text || "(empty)";
  expect(res.status(), `${endpoint} answered ${res.status()} instead of ${status}${signInHint(res, status)}\nResponse: ${body}`).toBe(status);
  return text;
}
