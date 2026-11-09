import { expect, type APIResponse, type Response } from "@playwright/test";
import { z } from "zod";

/**
 * A response whose JSON body type its client declares (`request.get(…) as Promise<JsonResponse<T>>`),
 * so `expectJson` knows the body type and specs never repeat `expectJson<T>(…)`.
 */
export type JsonResponse<T> = APIResponse & { readonly __body?: T };

/** A field of the contract's type `C` written as a schema: the contract has it, and the schema takes every value the contract allows. */
type ContractField<C, K, S extends z.ZodType> = K extends keyof C
  ? [NonNullable<C[K]>] extends [object]
    ? S // a nested object or list: its own fieldsOf checks it
    : [Exclude<C[K], undefined>] extends [z.output<S>]
      ? S
      : { "the contract allows more than the schema": Exclude<C[K], undefined> }
  : { "the contract has no such field": K };

/**
 * The fields of an answer the tests read, tied to the generated contract type (`npm run api:types`):
 * `const order = fieldsOf<components["schemas"]["Order"]>()({ id: z.string(), total: z.number().nullable() })`.
 * A field the contract no longer has, or allows other values for, fails `npm run typecheck` here.
 */
export const fieldsOf =
  <C>() =>
  <const S extends Record<string, z.ZodType>>(fields: S & { [K in keyof S]: ContractField<C, K, S[K]> }) =>
    z.object(fields as S);

const responseSchemas = new WeakMap<APIResponse, z.ZodType>();
/** "POST /api/teams/42/invitations" → the schema of its answer, for `expectAnswer`. */
const answerSchemas = new Map<string, z.ZodType>();
const answerKey = (method: string, path: string) => `${method.toUpperCase()} /${path.replace(/^\/+/, "").toLowerCase()}`;

const fieldPath = (path: readonly PropertyKey[]) =>
  path.map((key, index) => (typeof key === "number" ? `[${key}]` : `${index ? "." : ""}${String(key)}`)).join("") || "the body";

/** The answer holds the fields the tests read, typed as they read them; a field it adds passes. */
function checkFields(body: unknown, schema: z.ZodType | undefined, who: string): void {
  const result = schema?.safeParse(body);
  if (!result || result.success) return;
  const fields = result.error.issues.slice(0, 5).map((issue) => {
    const said = issue.message.replace(/^Invalid input: /, "");
    return `  ${fieldPath(issue.path)}: ${/received undefined$/.test(said) ? `missing (${said.replace(/, received undefined$/, "")})` : said}`;
  });
  throw new Error(`${who} answered, but a field the tests read is missing or retyped:\n${fields.join("\n")}\nIf the API changed: npm run api:types, then npm run typecheck names every place to update.`);
}

/**
 * A client's call with its body type: `profile: () => json<UserProfile>(request.get("api/userProfile", { headers }))`;
 * with a schema instead, the body is what it reads, checked by `expectJson`:
 * `orders: () => json(request.get("api/orders", { headers }), z.array(order))`.
 */
export function json<T>(response: Promise<APIResponse>): Promise<JsonResponse<T>>;
export function json<S extends z.ZodType>(response: Promise<APIResponse>, schema: S): Promise<JsonResponse<z.output<S>>>;
export function json(response: Promise<APIResponse>, schema?: z.ZodType): Promise<APIResponse> {
  if (!schema) return response;
  return response.then((answer) => {
    responseSchemas.set(answer, schema);
    return answer;
  });
}

/**
 * A request the page sends — its method and path — with the body type its answer carries: what
 * `answerTo` waits for. The app's API client declares it beside its calls (`inviteTo: (id: string) =>
 * answerPath<Invitation>("POST", `api/teams/${id}/invitations`)`), so a spec names neither the
 * path, nor the method, nor the type. The path matches the end of the request's path, whatever its
 * letter case (the page may spell `ordersSummary` where the contract says `OrdersSummary`).
 */
export interface AnswerPath<T> {
  readonly method: string;
  readonly path: string;
  readonly __answer?: T;
}

/**
 * A request with the body type of its answer: `answerPath<Invitation>("POST", "api/teams/42/invitations")`;
 * with a schema instead (`answerPath("POST", …, invitation)`), `expectAnswer` checks the answer by it.
 */
export function answerPath<T>(method: string, path: string): AnswerPath<T>;
export function answerPath<S extends z.ZodType>(method: string, path: string, schema: S): AnswerPath<z.output<S>>;
export function answerPath(method: string, path: string, schema?: z.ZodType): AnswerPath<unknown> {
  if (schema) answerSchemas.set(answerKey(method, path), schema);
  return { method: method.toUpperCase(), path };
}

/** The schema of a page's answer: the longest declared path its request's path ends with, same method. */
function answerSchemaOf(response: Response): z.ZodType | undefined {
  const method = response.request().method().toUpperCase();
  const address = new URL(response.url()).pathname.toLowerCase();
  const keys = [...answerSchemas.keys()].filter((key) => key.startsWith(`${method} `) && address.endsWith(key.slice(method.length + 1)));
  const longest = keys.sort((a, b) => b.length - a.length)[0];
  return longest ? answerSchemas.get(longest) : undefined;
}

/** What both a client's response and the page's answer have — the status check reads only these. */
type Answered = Pick<APIResponse | Response, "status" | "text" | "url" | "headers">;

/** An unexpected 401/403 says whether the session or the rights are the problem, with the server's reason. */
function signInHint(res: Answered, expected: number): string {
  if (res.status() === expected) return "";
  const reason = res.headers()["www-authenticate"];
  if (res.status() === 401) return ` — the API did not accept the session${reason ? ` (${reason})` : ""}: check the login setup (specs/project-map.md §Auth)`;
  if (res.status() === 403) return " — the session is accepted, but this user has no rights for it";
  return "";
}

/**
 * Asserts the status (200 unless named) and returns the parsed body; a mismatch says which endpoint
 * answered what, with the body. A success answer of a call with a schema (`json(…, schema)`) is checked by it.
 */
export async function expectJson<T = unknown>(response: JsonResponse<T> | Promise<JsonResponse<T>>, status = 200): Promise<T> {
  const res = await response;
  const text = await checkStatus(res, status);
  const body: unknown = text ? JSON.parse(text) : undefined;
  if (status < 300) checkFields(body, responseSchemas.get(res), new URL(res.url()).pathname);
  return body as T;
}

/** Same check for a response whose body is not read — it may be a file (a PDF export), not JSON. */
export async function expectStatus(response: APIResponse | Promise<APIResponse>, status: number): Promise<void> {
  await checkStatus(await response, status);
}

/**
 * The same check for an answer the page received (`whenAnswered` returns it): the status (200 unless
 * named) and the parsed body, empty for a 204. A UI test takes it through the `answerTo` fixture.
 */
export async function expectAnswer<T = unknown>(response: Response, status = 200): Promise<T> {
  const text = await checkStatus(response, status, "The page's request ");
  const body: unknown = text ? JSON.parse(text) : undefined;
  if (status < 300) checkFields(body, answerSchemaOf(response), `The page's request ${response.request().method()} ${new URL(response.url()).pathname}`);
  return body as T;
}

async function checkStatus(res: Answered, status: number, who = ""): Promise<string> {
  const text = await res.text();
  const endpoint = new URL(res.url()).pathname;
  const body = text.length > 300 ? `${text.slice(0, 300)} …` : text || "(empty)";
  expect(res.status(), `${who}${endpoint} answered ${res.status()} instead of ${status}${signInHint(res, status)}\nResponse: ${body}`).toBe(status);
  return text;
}
