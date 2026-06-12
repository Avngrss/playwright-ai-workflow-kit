import { generateUniqueEmail } from "../generators/unique-email.generator";
import type { RegistrationFormData } from "../types/registration-form-data.type";

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
  password: "SuperSecure@123",
};

export const registrationFormDataBuilder = {
  build(overrides: Partial<RegistrationFormData> = {}): RegistrationFormData {
    return {
      ...DEFAULT_REGISTRATION_FORM_DATA,
      email: generateUniqueEmail("registration.ui"),
      ...overrides,
    };
  },
};
