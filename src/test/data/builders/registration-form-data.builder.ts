import { randomUUID } from "node:crypto";
import { generateUniqueEmail } from "../generators/unique-email.generator";
import type { RegistrationFormData } from "../types/registration-form-data.type";

function buildStrongPassword(): string {
  return `E2E!Aa${Date.now()}#${randomUUID().slice(0, 8)}`;
}

const DEFAULT_REGISTRATION_FORM_DATA: RegistrationFormData = {
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  country: "Netherlands (the)",
  postalCode: "1234AA",
  houseNumber: "42",
  street: "Main Street",
  city: "Amsterdam",
  state: "Noord-Holland",
  phone: "0612345678",
  email: "",
  password: "",
};

export const registrationFormDataBuilder = {
  build(overrides: Partial<RegistrationFormData> = {}): RegistrationFormData {
    return {
      ...DEFAULT_REGISTRATION_FORM_DATA,
      email: generateUniqueEmail("registration.ui"),
      password: buildStrongPassword(),
      ...overrides,
    };
  },
};
