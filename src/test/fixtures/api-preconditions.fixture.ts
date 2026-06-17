import { expect, base } from "./base.fixture";
import { request as playwrightRequest } from "@playwright/test";
import { registrationUserRequestBuilder } from "../data/builders/registration-user-request.builder";
import type { RegistrationUserRequest } from "../data/types/registration-user-request.type";

type RegistrationApiPreconditionSetup = {
  createRegisteredUser(
    overrides?: Partial<RegistrationUserRequest>,
  ): Promise<RegistrationUserRequest>;
};

type ApiPreconditionsFixtures = {
  registrationApiPreconditionSetup: RegistrationApiPreconditionSetup;
};

const test = base.extend<ApiPreconditionsFixtures>({
  registrationApiPreconditionSetup: async ({}, use) => {
    const apiBaseUrl =
      process.env.UI_PRECONDITION_API_BASE_URL ?? process.env.UI_API_BASE_URL;

    if (!apiBaseUrl) {
      throw new Error(
        "UI API precondition setup requires UI_PRECONDITION_API_BASE_URL (or UI_API_BASE_URL) in environment.",
      );
    }

    const apiRequestContext = await playwrightRequest.newContext({
      baseURL: apiBaseUrl,
    });

    const registrationSetup: RegistrationApiPreconditionSetup = {
      createRegisteredUser: async (
        overrides: Partial<RegistrationUserRequest> = {},
      ): Promise<RegistrationUserRequest> => {
        const payload = registrationUserRequestBuilder.build(overrides);
        const response = await apiRequestContext.post("/users/register", {
          data: payload,
        });

        if (response.status() !== 201) {
          const body = await response.text();
          throw new Error(
            `User precondition setup failed. Expected 201, got ${response.status()}. Response: ${body}`,
          );
        }

        return payload;
      },
    };

    await use(registrationSetup);
    await apiRequestContext.dispose();
  },
});

export { test, expect };
