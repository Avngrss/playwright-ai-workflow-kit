import { expect, test } from '@playwright/test';
import {
  expectContactSendMessageResponse,
  expectContactValidationErrorsForField,
} from '../../../src/test/assertions/api/contact-response.assertion';

const CONTACT_MESSAGES_ENDPOINT = '/messages';
const CONTACT_MESSAGE_PAYLOAD = {
  name: 'API Contact User',
  email: 'api-contact-user@example.test',
  subject: 'customer-service',
  message:
    'This is a deterministic contact API message used for smoke contract validation and status checks.',
} as const;
const INVALID_EMAIL = 'invalid-email';

const CONTACT_NEGATIVE_CASES = [
  {
    name: 'subject is missing',
    payload: {
      name: CONTACT_MESSAGE_PAYLOAD.name,
      email: CONTACT_MESSAGE_PAYLOAD.email,
      message: CONTACT_MESSAGE_PAYLOAD.message,
    },
    expectedErrorField: 'subject',
  },
  {
    name: 'message is missing',
    payload: {
      name: CONTACT_MESSAGE_PAYLOAD.name,
      email: CONTACT_MESSAGE_PAYLOAD.email,
      subject: CONTACT_MESSAGE_PAYLOAD.subject,
    },
    expectedErrorField: 'message',
  },
  {
    name: 'email is invalid',
    payload: {
      name: CONTACT_MESSAGE_PAYLOAD.name,
      email: INVALID_EMAIL,
      subject: CONTACT_MESSAGE_PAYLOAD.subject,
      message: CONTACT_MESSAGE_PAYLOAD.message,
    },
    expectedErrorField: 'email',
  },
] as const;

test.describe('Contact API | POST /messages', { tag: ['@contact'] }, () => {
  test('sends a contact message with successful response data', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const response = await request.post(CONTACT_MESSAGES_ENDPOINT, {
      data: CONTACT_MESSAGE_PAYLOAD,
    });

    expect(response.status()).toBe(200);
    const body = expectContactSendMessageResponse(await response.json());
    expect(body.name).toBe(CONTACT_MESSAGE_PAYLOAD.name);
    expect(body.email).toBe(CONTACT_MESSAGE_PAYLOAD.email);
    expect(body.subject).toBe(CONTACT_MESSAGE_PAYLOAD.subject);
    expect(body.message).toBe(CONTACT_MESSAGE_PAYLOAD.message);
  });

  for (const negativeCase of CONTACT_NEGATIVE_CASES) {
    test(
      `returns validation errors when ${negativeCase.name} (live behavior)`,
      { tag: ['@api', '@regression'] },
      async ({ request }) => {
        const response = await request.post(CONTACT_MESSAGES_ENDPOINT, {
          data: negativeCase.payload,
        });

        expect(response.status()).toBe(422);
        expectContactValidationErrorsForField(
          await response.json(),
          negativeCase.expectedErrorField,
        );
      },
    );
  }
});
