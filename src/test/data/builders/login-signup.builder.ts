import {
  LoginCredentials,
  SignupUserData,
} from "../types/login-signup.type";
import { generateUniqueEmail } from "../generators/unique.generator";

export class LoginSignupBuilder {
  buildSignupUser(overrides: Partial<SignupUserData> = {}): SignupUserData {
    return {
      name: "QA Signup User",
      email: generateUniqueEmail("ae-signup"),
      password: "QaPwd#12345",
      day: "1",
      month: "1",
      year: "2000",
      firstName: "QA",
      lastName: "User",
      address: "123 Test Street",
      country: "India",
      state: "Maharashtra",
      city: "Mumbai",
      zipcode: "400001",
      mobileNumber: "9999999999",
      ...overrides,
    };
  }

  buildInvalidLoginCredentials(
    overrides: Partial<LoginCredentials> = {}
  ): LoginCredentials {
    return {
      email: generateUniqueEmail("ae-invalid"),
      password: "invalid-password",
      ...overrides,
    };
  }
}

export const loginSignupBuilder = new LoginSignupBuilder();
