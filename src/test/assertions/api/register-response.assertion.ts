import {
  registerDuplicateConflictResponseSchema,
  registerUserRequestSchema,
  registerUserResponseSchema,
  type RegisterDuplicateConflictResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
} from "../../schemas/api/register.schema";
import { expectToMatchSchema } from "./zod-schema.assertion";

export function expectRegisterUserRequestPayload(
  payload: unknown,
): RegisterUserRequest {
  return expectToMatchSchema(
    registerUserRequestSchema,
    payload,
    "Register request schema validation failed.",
  );
}

export function expectRegisterUserResponse(
  body: unknown,
): RegisterUserResponse {
  return expectToMatchSchema(
    registerUserResponseSchema,
    body,
    "Register success response schema validation failed.",
  );
}

export function expectRegisterDuplicateConflictResponse(
  body: unknown,
): RegisterDuplicateConflictResponse {
  return expectToMatchSchema(
    registerDuplicateConflictResponseSchema,
    body,
    "Register conflict response schema validation failed.",
  );
}
