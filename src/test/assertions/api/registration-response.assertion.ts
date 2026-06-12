import { expect } from '@playwright/test';

function expectStringIfDefined(value: unknown): void {
  if (value !== undefined) {
    expect(typeof value).toBe('string');
  }
}

function expectNullableStringIfDefined(value: unknown): void {
  if (value !== undefined) {
    expect(value === null || typeof value === 'string').toBeTruthy();
  }
}

function expectBooleanIfDefined(value: unknown): void {
  if (value !== undefined) {
    expect(typeof value).toBe('boolean');
  }
}

function expectNullableIntegerIfDefined(value: unknown): void {
  if (value !== undefined) {
    expect(value === null || (typeof value === 'number' && Number.isInteger(value))).toBeTruthy();
  }
}

export function expectUserResponseSchema(body: unknown): void {
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  const user = body as Record<string, unknown>;

  expectStringIfDefined(user.first_name);
  expectStringIfDefined(user.last_name);

  if (user.address !== undefined) {
    expect(typeof user.address).toBe('object');
    expect(user.address).not.toBeNull();

    const address = user.address as Record<string, unknown>;
    expectNullableStringIfDefined(address.street);
    expectNullableStringIfDefined(address.house_number);
    expectNullableStringIfDefined(address.city);
    expectNullableStringIfDefined(address.state);
    expectNullableStringIfDefined(address.country);
    expectNullableStringIfDefined(address.postal_code);
  }

  expectNullableStringIfDefined(user.phone);
  expectNullableStringIfDefined(user.dob);
  expectStringIfDefined(user.email);
  expectStringIfDefined(user.id);
  expectNullableStringIfDefined(user.provider);
  expectBooleanIfDefined(user.totp_enabled);
  expectBooleanIfDefined(user.enabled);
  expectNullableIntegerIfDefined(user.failed_login_attempts);
  expectStringIfDefined(user.created_at);
}

export function expectDuplicateConflictResponse(body: unknown): void {
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  const conflict = body as Record<string, unknown>;

  if (typeof conflict.message === 'string') {
    return;
  }

  const fieldEntries = Object.entries(conflict);
  expect(fieldEntries.length).toBeGreaterThan(0);

  for (const [, value] of fieldEntries) {
    expect(Array.isArray(value)).toBeTruthy();
    for (const item of value as unknown[]) {
      expect(typeof item).toBe('string');
    }
  }
}
