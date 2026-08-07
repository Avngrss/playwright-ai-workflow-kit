import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { createUniqueEmail } from "../../data/generators/email.generator";

export const defaultAuthPassword = "ValidPass@123";

const registerPayloadBase = {
  first_name: "Test",
  last_name: "AuthUser",
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
} as const;

export type DisposableUserCredentials = {
  email: string;
  password: string;
};

export function createDisposableUserCredentials(
  prefix: string,
  password = defaultAuthPassword,
): DisposableUserCredentials {
  return {
    email: createUniqueEmail(prefix),
    password,
  };
}

export async function registerDisposableUser(
  request: APIRequestContext,
  credentials: DisposableUserCredentials,
): Promise<void> {
  const response = await request.post("/users/register", {
    data: {
      ...registerPayloadBase,
      email: credentials.email,
      password: credentials.password,
    },
  });

  // Setup verifies only required precondition creation.
  expect(response.status()).toBe(201);
}
