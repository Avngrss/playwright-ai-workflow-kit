import { expect } from '@playwright/test';
import {
  duplicateConflictResponseSchema,
  type DuplicateConflictResponse,
  registrationValidationErrorResponseSchema,
  type RegistrationValidationErrorResponse,
  type UserResponse,
  userResponseSchema,
} from '../../schemas/api/registration.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectUserResponseSchema(body: unknown): UserResponse {
  return expectToMatchSchema(
    userResponseSchema,
    body,
    'Registration user response schema validation failed.',
  );
}

export function expectDuplicateConflictResponse(body: unknown): DuplicateConflictResponse {
  return expectToMatchSchema(
    duplicateConflictResponseSchema,
    body,
    'Registration duplicate conflict response schema validation failed.',
  );
}

export function expectRegistrationValidationErrorResponse(
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
