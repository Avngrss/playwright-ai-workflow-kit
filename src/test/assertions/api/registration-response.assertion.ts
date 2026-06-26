import { expect } from '@playwright/test';
import {
  duplicateConflictResponseSchema,
  type DuplicateConflictResponse,
  registrationValidationErrorResponseSchema,
  type RegistrationValidationErrorResponse,
} from '../../schemas/api/registration.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectDuplicateConflictResponse(body: unknown): DuplicateConflictResponse {
  return expectToMatchSchema(
    duplicateConflictResponseSchema,
    body,
    'Registration duplicate conflict response schema validation failed.',
  );
}

function expectRegistrationValidationErrorResponse(
  body: unknown,
): RegistrationValidationErrorResponse {
  return expectToMatchSchema(
    registrationValidationErrorResponseSchema,
    body,
    'Registration validation-error response schema validation failed.',
  );
}

export function expectRegistrationValidationErrorsForField(
  body: unknown,
  field: string,
): string[] {
  const validationErrors = expectRegistrationValidationErrorResponse(body);
  const fieldErrors = validationErrors[field];

  expect(
    fieldErrors,
    `Registration validation-error response is missing field errors for "${field}".`,
  ).toBeDefined();

  return fieldErrors as string[];
}
