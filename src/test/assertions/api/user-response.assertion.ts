import {
  type UserResponse,
  userResponseSchema,
} from '../../schemas/api/user.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectUserResponseSchema(body: unknown): UserResponse {
  return expectToMatchSchema(
    userResponseSchema,
    body,
    'User response schema validation failed.',
  );
}
