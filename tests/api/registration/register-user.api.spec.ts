import { expect, test } from '@playwright/test';
import {
  expectDuplicateConflictResponse,
  expectRegistrationValidationErrorsForField,
  expectUserResponseSchema,
} from '../../../src/test/assertions/api/registration-response.assertion';
import { registrationUserRequestBuilder } from '../../../src/test/data/builders/registration-user-request.builder';

const REGISTER_ENDPOINT = '/users/register';
const FIRST_NAME_MAX_LENGTH = 40;
const LAST_NAME_MAX_LENGTH = 20;
const EMAIL_MAX_LENGTH = 256;

function buildEmailLongerThanMaxLength(maxLength: number): string {
  return `${'a'.repeat(maxLength)}@example.test`;
}

test.describe('Registration API | POST /users/register', { tag: ['@registration', '@auth'] }, () => {
  test('creates user with valid required payload', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const payload = registrationUserRequestBuilder.build();

    const response = await request.post(REGISTER_ENDPOINT, { data: payload });
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(typeof body.id).toBe('string');
    expect(body.email).toBe(payload.email);
  });

  test('returns a 201 body matching UserResponse contract shape', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const payload = registrationUserRequestBuilder.build();

    const response = await request.post(REGISTER_ENDPOINT, { data: payload });
    const body = await response.json();

    expect(response.status()).toBe(201);
    expectUserResponseSchema(body);
  });

  test('returns documented duplicate conflict contract for same email', { tag: ['@api', '@regression'] }, async ({ request }) => {
    const payload = registrationUserRequestBuilder.build();

    const firstResponse = await request.post(REGISTER_ENDPOINT, { data: payload });
    expect(firstResponse.status()).toBe(201);

    const duplicateResponse = await request.post(REGISTER_ENDPOINT, { data: payload });
    const duplicateBody = await duplicateResponse.json();

    expect(duplicateResponse.status()).toBe(409);
    expectDuplicateConflictResponse(duplicateBody);
  });

  test('returns 422 for malformed request payload (live behavior)', { tag: ['@api', '@regression'] }, async ({ request }) => {
    const validPayload = registrationUserRequestBuilder.build();
    const { email: _removedEmail, ...payloadWithoutEmail } = validPayload;

    const response = await request.post(REGISTER_ENDPOINT, { data: payloadWithoutEmail });
    const body = await response.json();

    expect(response.status()).toBe(422);
    expectRegistrationValidationErrorsForField(body, 'email');
  });

  const invalidConstraintCases = [
    {
      name: 'first_name longer than maxLength 40',
      overrides: { first_name: 'A'.repeat(FIRST_NAME_MAX_LENGTH + 1) },
      expectedErrorField: 'first_name',
    },
    {
      name: 'last_name longer than maxLength 20',
      overrides: { last_name: 'B'.repeat(LAST_NAME_MAX_LENGTH + 1) },
      expectedErrorField: 'last_name',
    },
    {
      name: 'email longer than maxLength 256',
      overrides: { email: buildEmailLongerThanMaxLength(EMAIL_MAX_LENGTH) },
      expectedErrorField: 'email',
    },
    {
      name: 'password shorter than minLength 8',
      overrides: { password: 'Ab1@xyz' },
      expectedErrorField: 'password',
    },
  ] as const;

  for (const invalidCase of invalidConstraintCases) {
    test(`returns 422 when ${invalidCase.name} (live behavior)`, { tag: ['@api', '@regression'] }, async ({ request }) => {
      const payload = registrationUserRequestBuilder.build(invalidCase.overrides);

      const response = await request.post(REGISTER_ENDPOINT, { data: payload });
      const body = await response.json();

      expect(response.status()).toBe(422);
      expectRegistrationValidationErrorsForField(body, invalidCase.expectedErrorField);
    });
  }

  test.fixme(
    'postponed: email format validation contract mismatch',
    { tag: ['@api', '@regression'] },
    async ({ request }) => {
      const payload = registrationUserRequestBuilder.build({
        email: 'not-an-email',
      });

      const response = await request.post(REGISTER_ENDPOINT, { data: payload });
      expect(response.status()).toBe(422);
    },
  );
});
