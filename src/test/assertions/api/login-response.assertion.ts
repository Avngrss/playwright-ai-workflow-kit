import {
  loginErrorResponseSchema,
  loginTokenResponseSchema,
  unauthorizedResponseSchema,
  type LoginErrorResponse,
  type LoginTokenResponse,
  type UnauthorizedResponse,
} from '../../schemas/api/login.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectLoginTokenResponse(body: unknown): LoginTokenResponse {
  return expectToMatchSchema(
    loginTokenResponseSchema,
    body,
    'Login token response schema validation failed.',
  );
}

export function expectLoginErrorResponse(body: unknown): LoginErrorResponse {
  return expectToMatchSchema(
    loginErrorResponseSchema,
    body,
    'Login error response schema validation failed.',
  );
}

export function expectUnauthorizedResponse(body: unknown): UnauthorizedResponse {
  return expectToMatchSchema(
    unauthorizedResponseSchema,
    body,
    'Unauthorized response schema validation failed.',
  );
}
