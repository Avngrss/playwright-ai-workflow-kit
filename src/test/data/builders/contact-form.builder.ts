import { createUniqueEmail } from "../generators/email.generator";
import type { ContactFormData } from "../types/contact-form-data.type";

const defaultValidMessage =
  "This is a valid contact form message with enough characters for UI validation.";

export function createValidContactFormData(
  overrides: Partial<ContactFormData> = {},
): ContactFormData {
  return {
    firstName: "Contact",
    lastName: "Tester",
    email: createUniqueEmail("contact-ui"),
    subject: "Customer service",
    message: defaultValidMessage,
    ...overrides,
  };
}
