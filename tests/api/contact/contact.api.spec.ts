import { expect, test } from '@playwright/test';
import { expectContactSendMessageResponse } from '../../../src/test/assertions/api/contact-response.assertion';

const CONTACT_MESSAGES_ENDPOINT = '/messages';
const CONTACT_MESSAGE_PAYLOAD = {
  name: 'API Contact User',
  email: 'api-contact-user@example.test',
  subject: 'customer-service',
  message:
    'This is a deterministic contact API message used for smoke contract validation and status checks.',
} as const;

test.describe('Contact API | POST /messages', () => {
  test('sends a contact message with successful response data', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const response = await request.post(CONTACT_MESSAGES_ENDPOINT, {
      data: CONTACT_MESSAGE_PAYLOAD,
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expectContactSendMessageResponse(body);
    expect(body.name).toBe(CONTACT_MESSAGE_PAYLOAD.name);
    expect(body.email).toBe(CONTACT_MESSAGE_PAYLOAD.email);
    expect(body.subject).toBe(CONTACT_MESSAGE_PAYLOAD.subject);
    expect(body.message).toBe(CONTACT_MESSAGE_PAYLOAD.message);
  });
});
