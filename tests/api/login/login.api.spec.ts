import { expect, test } from '@playwright/test';
import {
  expectLoginErrorResponse,
  expectLoginTokenResponse,
  expectUnauthorizedResponse,
} from '../../../src/test/assertions/api/login-response.assertion';
import { expectUserResponseSchema } from '../../../src/test/assertions/api/registration-response.assertion';
import { registrationUserRequestBuilder } from '../../../src/test/data/builders/registration-user-request.builder';

const REGISTER_ENDPOINT = '/users/register';
const LOGIN_ENDPOINT = '/users/login';
const CURRENT_USER_ENDPOINT = '/users/me';
const INVALID_CREDENTIALS = {
  email: 'invalid-login@example.test',
  password: 'wrong-password-123',
} as const;
const LOGIN_VALIDATION_FAILURE_CASES = [
  {
    name: 'email is missing',
    payload: {
      password: 'welcome01',
    },
  },
  {
    name: 'password is missing',
    payload: {
      email: 'customer@practicesoftwaretesting.com',
    },
  },
] as const;
const INVALID_LOGIN_REQUEST_MESSAGE = 'Invalid login request';
const UNAUTHORIZED_MESSAGE = 'Unauthorized';
const INVALID_TOKEN = 'Bearer invalid-token';

test.describe('Login API | POST /users/login', { tag: ['@login', '@auth'] }, () => {
  test('returns documented token payload for valid credentials', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const userPayload = registrationUserRequestBuilder.build();
    const registerResponse = await request.post(REGISTER_ENDPOINT, { data: userPayload });

    expect(registerResponse.status()).toBe(201);

    const loginResponse = await request.post(LOGIN_ENDPOINT, {
      data: {
        email: userPayload.email,
        password: userPayload.password,
      },
    });

    expect(loginResponse.status()).toBe(200);
    expectLoginTokenResponse(await loginResponse.json());
  });

  test('issues token that is accepted by /users/me', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const userPayload = registrationUserRequestBuilder.build();
    const registerResponse = await request.post(REGISTER_ENDPOINT, { data: userPayload });

    expect(registerResponse.status()).toBe(201);

    const loginResponse = await request.post(LOGIN_ENDPOINT, {
      data: {
        email: userPayload.email,
        password: userPayload.password,
      },
    });

    expect(loginResponse.status()).toBe(200);
    const loginBody = expectLoginTokenResponse(await loginResponse.json());

    const currentUserResponse = await request.get(CURRENT_USER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${loginBody.access_token}`,
      },
    });

    expect(currentUserResponse.status()).toBe(200);
    const currentUserBody = expectUserResponseSchema(await currentUserResponse.json());
    expect(currentUserBody.email).toBe(userPayload.email);
  });

  test('returns unauthorized error for invalid credentials (live behavior)', { tag: ['@api', '@regression'] }, async ({ request }) => {
    const response = await request.post(LOGIN_ENDPOINT, {
      data: INVALID_CREDENTIALS,
    });

    expect(response.status()).toBe(401);
    const body = expectLoginErrorResponse(await response.json());
    expect(body.error).toBe(UNAUTHORIZED_MESSAGE);
  });

  for (const loginValidationCase of LOGIN_VALIDATION_FAILURE_CASES) {
    test(
      `returns invalid login request when ${loginValidationCase.name} (live behavior)`,
      { tag: ['@api', '@regression'] },
      async ({ request }) => {
        const response = await request.post(LOGIN_ENDPOINT, {
          data: loginValidationCase.payload,
        });

        expect(response.status()).toBe(401);
        const body = expectLoginErrorResponse(await response.json());
        expect(body.error).toBe(INVALID_LOGIN_REQUEST_MESSAGE);
      },
    );
  }

  test('returns unauthorized response for /users/me without token', { tag: ['@api', '@regression'] }, async ({ request }) => {
    const response = await request.get(CURRENT_USER_ENDPOINT);

    expect(response.status()).toBe(401);
    const body = expectUnauthorizedResponse(await response.json());
    expect(body.message).toBe(UNAUTHORIZED_MESSAGE);
  });

  test('returns unauthorized response for /users/me with invalid token', { tag: ['@api', '@regression'] }, async ({ request }) => {
    const response = await request.get(CURRENT_USER_ENDPOINT, {
      headers: {
        Authorization: INVALID_TOKEN,
      },
    });

    expect(response.status()).toBe(401);
    const body = expectUnauthorizedResponse(await response.json());
    expect(body.message).toBe(UNAUTHORIZED_MESSAGE);
  });
});
