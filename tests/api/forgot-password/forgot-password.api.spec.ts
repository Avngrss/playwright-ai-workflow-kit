import { expect, test } from '@playwright/test';
import { expectForgotPasswordUpdateResponse } from '../../../src/test/assertions/api/forgot-password-response.assertion';
import { registrationUserRequestBuilder } from '../../../src/test/data/builders/registration-user-request.builder';

const REGISTER_ENDPOINT = '/users/register';
const FORGOT_PASSWORD_ENDPOINT = '/users/forgot-password';

test.describe(
  'Forgot Password API | POST /users/forgot-password',
  { tag: ['@auth'] },
  () => {
    test(
      'returns documented UpdateResponse payload for a valid forgot-password request',
      { tag: ['@api', '@smoke'] },
      async ({ request }) => {
        const userPayload = registrationUserRequestBuilder.build();
        const registerResponse = await request.post(REGISTER_ENDPOINT, {
          data: userPayload,
        });

        expect(registerResponse.status()).toBe(201);

        const forgotPasswordResponse = await request.post(
          FORGOT_PASSWORD_ENDPOINT,
          {
            data: {
              email: userPayload.email,
            },
          },
        );

        expect(forgotPasswordResponse.status()).toBe(200);
        expectForgotPasswordUpdateResponse(await forgotPasswordResponse.json());
      },
    );
  },
);
