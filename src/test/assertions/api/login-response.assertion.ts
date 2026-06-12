import { expect } from "@playwright/test";

export function expectLoginTokenResponse(body: unknown): asserts body is {
  access_token: string;
  token_type: string;
  expires_in: number;
} {
  expect(typeof body).toBe("object");
  expect(body).not.toBeNull();

  const tokenResponse = body as Record<string, unknown>;

  expect(typeof tokenResponse.access_token).toBe("string");
  expect(tokenResponse.access_token).not.toHaveLength(0);
  expect(typeof tokenResponse.token_type).toBe("string");
  expect(typeof tokenResponse.expires_in).toBe("number");
}
