import {
  forgotPasswordUpdateResponseSchema,
  type ForgotPasswordUpdateResponse,
} from '../../schemas/api/forgot-password.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectForgotPasswordUpdateResponse(
  body: unknown,
): ForgotPasswordUpdateResponse {
  return expectToMatchSchema(
    forgotPasswordUpdateResponseSchema,
    body,
    'Forgot-password update response schema validation failed.',
  );
}
