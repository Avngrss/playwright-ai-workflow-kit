import { generateUniqueEmail } from "../generators/unique-email.generator";
import type { RegistrationUserRequest } from "../types/registration-user-request.type";

const DEFAULT_PASSWORD = "SuperSecure@123";

function buildDefaultRegistrationUserRequest(): RegistrationUserRequest {
  return {
    first_name: "John",
    last_name: "Doe",
    email: generateUniqueEmail(),
    password: DEFAULT_PASSWORD,
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
