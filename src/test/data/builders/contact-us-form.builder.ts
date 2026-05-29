import { ContactUsFormData } from "../types/contact-us-form.type";

export class ContactUsFormBuilder {
  build(overrides: Partial<ContactUsFormData> = {}): ContactUsFormData {
    return {
      name: "QA Contact",
      email: "qa.contact@example.com",
      subject: "Contact Form Test",
      message: "Please confirm receipt.",
      ...overrides,
    };
  }
}

export const contactUsFormBuilder = new ContactUsFormBuilder();
