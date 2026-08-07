import { expect, test } from "../../src/test/fixtures/test";
import {
  expectRegisterDuplicateConflictResponse,
  expectRegisterUserRequestPayload,
  expectRegisterUserResponse,
} from "../../src/test/assertions/api/register-response.assertion";
import type { RegisterUserRequest } from "../../src/test/schemas/api/register.schema";
import { createUniqueEmail } from "../../src/test/data/generators/email.generator";
import { applyAllureMetadata } from "../../src/test/reporting/allure-metadata.helper";

const registerPayloadBase: Omit<RegisterUserRequest, "email"> = {
  first_name: "John",
  last_name: "Doe",
  address: {
    street: "Street 1",
    house_number: "12",
    city: "City",
    state: "State",
    country: "Country",
    postal_code: "1234AA",
  },
  phone: "0987654321",
  dob: "1990-01-01",
  password: "ValidPass@123",
};

const registrationValidationStatuses = new Set([400, 422]);

test.describe("Registration API", { tag: ["@api", "@register"] }, () => {
  const commonMetadata = {
    feature: "Registration",
    suite: "Registration API",
    owner: "qa",
    layer: "api" as const,
    tags: ["registration"],
  };

  test.beforeEach(async () => {
    await applyAllureMetadata(commonMetadata);
  });

  test(
    "creates a user with valid payload",
    { tag: ["@smoke"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Create user with valid payload",
        severity: "BLOCKER",
      });

      const payload = expectRegisterUserRequestPayload({
        ...registerPayloadBase,
        email: createUniqueEmail("register-happy"),
      });

      const response = await request.post("/users/register", { data: payload });

      expect(response.status()).toBe(201);

      const body = expectRegisterUserResponse(await response.json());

      // Contract shape is validated by Zod above.
      // Assertions below verify scenario-specific behavior only.
      expect(body.id).toBeTruthy();
      expect(body.email).toBe(payload.email);
      expect(body).toEqual(
        expect.objectContaining({
          first_name: payload.first_name,
          last_name: payload.last_name,
        }),
      );
      expect(body).not.toHaveProperty("password");
    },
  );

  test(
    "returns 409 for duplicate email registration",
    { tag: ["@regression"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Duplicate email conflict",
        severity: "CRITICAL",
      });

      const duplicateEmail = createUniqueEmail("register-duplicate");

      const firstPayload = expectRegisterUserRequestPayload({
        ...registerPayloadBase,
        email: duplicateEmail,
      });

      const firstResponse = await request.post("/users/register", {
        data: firstPayload,
      });

      expect(firstResponse.status()).toBe(201);

      const duplicatePayload = expectRegisterUserRequestPayload({
        ...registerPayloadBase,
        email: duplicateEmail,
      });
      const duplicateResponse = await request.post("/users/register", {
        data: duplicatePayload,
      });

      expect(duplicateResponse.status()).toBe(409);
      expectRegisterDuplicateConflictResponse(await duplicateResponse.json());
    },
  );

  test(
    "returns 400 or 422 for missing required fields",
    { tag: ["@regression"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Missing required field validation",
        severity: "NORMAL",
      });

      const scenarios: Array<{
        name: string;
        removeField: "first_name" | "last_name" | "email" | "password";
      }> = [
        { name: "first name is missing", removeField: "first_name" },
        { name: "last name is missing", removeField: "last_name" },
        { name: "email is missing", removeField: "email" },
        { name: "password is missing", removeField: "password" },
      ];

      for (const scenario of scenarios) {
        await test.step(`Submit payload when ${scenario.name}`, async () => {
          const payload: Record<string, unknown> = {
            ...registerPayloadBase,
            email: createUniqueEmail("register-missing-required"),
          };
          delete payload[scenario.removeField];

          const response = await request.post("/users/register", { data: payload });
          expect(registrationValidationStatuses.has(response.status())).toBeTruthy();
        });
      }
    },
  );

  test(
    "returns 400 or 422 for invalid password boundary",
    { tag: ["@regression"] },
    async ({ request }) => {
      await applyAllureMetadata({
        story: "Invalid password boundary validation",
        severity: "NORMAL",
      });

      const invalidPasswordPayload = {
        ...registerPayloadBase,
        email: createUniqueEmail("register-invalid-password"),
        password: "Ab1!",
      };

      const response = await request.post("/users/register", {
        data: invalidPasswordPayload,
      });

      expect(registrationValidationStatuses.has(response.status())).toBeTruthy();
    },
  );
});
