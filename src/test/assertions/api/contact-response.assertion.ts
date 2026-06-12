import { expect } from '@playwright/test';

export function expectContactSendMessageResponse(body: unknown): asserts body is {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
} {
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  const response = body as Record<string, unknown>;

  expect(typeof response.id).toBe('string');
  expect(response.id).not.toHaveLength(0);
  expect(typeof response.name).toBe('string');
  expect(typeof response.email).toBe('string');
  expect(typeof response.subject).toBe('string');
  expect(typeof response.message).toBe('string');
  expect(typeof response.status).toBe('string');
  expect(response.status).not.toHaveLength(0);
  expect(typeof response.created_at).toBe('string');
  expect(response.created_at).not.toHaveLength(0);
}
