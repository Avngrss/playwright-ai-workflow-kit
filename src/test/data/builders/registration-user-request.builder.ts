import { randomUUID } from 'node:crypto';
import { generateUniqueEmail } from "../generators/unique-email.generator";
import type { RegistrationUserRequest } from "../types/registration-user-request.type";

function buildStrongPassword(): string {
  return `E2E!Aa${Date.now()}#${randomUUID().slice(0, 8)}`;
}

function buildDefaultRegistrationUserRequest(): RegistrationUserRequest {
  return {
    first_name: "John",
    last_name: "Doe",
    email: generateUniqueEmail(),
    password: buildStrongPassword(),
  };
}

export const registrationUserRequestBuilder = {
  build(
    overrides: Partial<RegistrationUserRequest> = {},
  ): RegistrationUserRequest {
    return {
      ...buildDefaultRegistrationUserRequest(),
      ...overrides,
    };
  },
};
