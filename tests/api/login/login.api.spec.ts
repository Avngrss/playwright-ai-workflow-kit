import { expect, test } from '@playwright/test';
import { expectLoginTokenResponse } from '../../../src/test/assertions/api/login-response.assertion';
import { expectUserResponseSchema } from '../../../src/test/assertions/api/registration-response.assertion';
import { registrationUserRequestBuilder } from '../../../src/test/data/builders/registration-user-request.builder';

const REGISTER_ENDPOINT = '/users/register';
const LOGIN_ENDPOINT = '/users/login';
const CURRENT_USER_ENDPOINT = '/users/me';

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
    const loginBody = await loginResponse.json();

    expect(loginResponse.status()).toBe(200);
    expectLoginTokenResponse(loginBody);
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
    const loginBody = await loginResponse.json();

    expect(loginResponse.status()).toBe(200);
    expectLoginTokenResponse(loginBody);

    const currentUserResponse = await request.get(CURRENT_USER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${loginBody.access_token}`,
      },
    });
    const currentUserBody = await currentUserResponse.json();

    expect(currentUserResponse.status()).toBe(200);
    expectUserResponseSchema(currentUserBody);
    expect(currentUserBody.email).toBe(userPayload.email);
  });
});
