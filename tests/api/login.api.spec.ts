import { createUniqueEmail } from "../../src/test/data/generators/email.generator";
import { expect, test } from "../../src/test/fixtures/test";
import {
  expectLoginRequestPayload,
  expectLoginTokenResponse,
} from "../../src/test/assertions/api/login-response.assertion";
import { applyAllureMetadata } from "../../src/test/reporting/allure-metadata.helper";
import {
  createDisposableUserCredentials,
  defaultAuthPassword,
  registerDisposableUser,
} from "../../src/test/setup/auth/disposable-user.setup";

function expectAuthFailureBody(body: unknown): void {
  expect(body).toEqual(
    expect.objectContaining({
      error: expect.any(String),
    }),
  );
}

test.describe("Login API", { tag: ["@api", "@login"] }, () => {
  const commonMetadata = {
    feature: "Login",
    suite: "Login API",
    owner: "qa",
    layer: "api" as const,
    tags: ["login"],
  };

  test.beforeEach(async () => {
    await applyAllureMetadata(commonMetadata);
  });

  test(
    "returns token for valid disposable user credentials",
    { tag: ["@smoke"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Successful login token issuance",
        severity: "BLOCKER",
      });

      const credentials = createDisposableUserCredentials("login-api");
      await registerDisposableUser(request, credentials);

      const payload = expectLoginRequestPayload(credentials);
      const response = await request.post("/users/login", { data: payload });

      expect(response.status()).toBe(200);

      const body = expectLoginTokenResponse(await response.json());
      expect(body.expires_in).toBeGreaterThan(0);
    },
  );

  test(
    "allows token to access current customer endpoint",
    { tag: ["@smoke"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Issued token is usable",
        severity: "CRITICAL",
      });

      const credentials = createDisposableUserCredentials("login-api");
      await registerDisposableUser(request, credentials);

      const loginPayload = expectLoginRequestPayload(credentials);
      const loginResponse = await request.post("/users/login", {
        data: loginPayload,
      });

      expect(loginResponse.status()).toBe(200);

      const tokenResponse = expectLoginTokenResponse(await loginResponse.json());
      const meResponse = await request.get("/users/me", {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      expect(meResponse.status()).toBe(200);

      const meBody = (await meResponse.json()) as { email?: string };
      expect(meBody.email).toBe(credentials.email);
    },
  );

  test(
    "rejects invalid password for an existing user",
    { tag: ["@regression"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Invalid password authentication failure",
        severity: "NORMAL",
      });

      const credentials = createDisposableUserCredentials("login-api");
      await registerDisposableUser(request, credentials);

      const response = await request.post("/users/login", {
        data: {
          email: credentials.email,
          password: `${credentials.password}-wrong`,
        },
      });

      expect(response.status()).toBe(401);
      expectAuthFailureBody(await response.json());
    },
  );

  test(
    "rejects requests with missing required login fields",
    { tag: ["@regression"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Missing login field rejection",
        severity: "NORMAL",
      });

      const scenarios: Array<{
        name: string;
        payload: Record<string, unknown>;
      }> = [
        {
          name: "password missing",
          payload: { email: createUniqueEmail("login-missing-password") },
        },
        {
          name: "email missing",
          payload: { password: defaultAuthPassword },
        },
      ];

      for (const scenario of scenarios) {
        await test.step(`Submit login when ${scenario.name}`, async () => {
          const response = await request.post("/users/login", {
            data: scenario.payload,
          });

          expect(response.status()).toBe(401);
          expectAuthFailureBody(await response.json());
        });
      }
    },
  );
});
