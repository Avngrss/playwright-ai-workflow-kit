import {
  loginRequestSchema,
  loginTokenResponseSchema,
  type LoginRequest,
  type LoginTokenResponse,
} from "../../schemas/api/login.schema";
import { expectToMatchSchema } from "./zod-schema.assertion";

export function expectLoginRequestPayload(payload: unknown): LoginRequest {
  return expectToMatchSchema(
    loginRequestSchema,
    payload,
    "Login request schema validation failed.",
  );
}

export function expectLoginTokenResponse(body: unknown): LoginTokenResponse {
  return expectToMatchSchema(
    loginTokenResponseSchema,
    body,
    "Login success response schema validation failed.",
  );
}
