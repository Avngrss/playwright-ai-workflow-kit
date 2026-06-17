import { expect } from '@playwright/test';
import {
  contactValidationErrorResponseSchema,
  contactSendMessageResponseSchema,
  type ContactValidationErrorResponse,
  type ContactSendMessageResponse,
} from '../../schemas/api/contact.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectContactSendMessageResponse(body: unknown): ContactSendMessageResponse {
  return expectToMatchSchema(
    contactSendMessageResponseSchema,
    body,
    'Contact send-message response schema validation failed.',
  );
}

export function expectContactValidationErrorResponse(
  body: unknown,
): ContactValidationErrorResponse {
  return expectToMatchSchema(
    contactValidationErrorResponseSchema,
    body,
    'Contact validation-error response schema validation failed.',
  );
}

export function expectContactValidationErrorsForField(
  body: unknown,
  field: string,
): string[] {
  const validationErrors = expectContactValidationErrorResponse(body);
  const fieldErrors = validationErrors[field];

  expect(
    fieldErrors,
    `Contact validation-error response is missing field errors for "${field}".`,
  ).toBeDefined();

  return fieldErrors as string[];
}
