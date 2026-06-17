import { z } from 'zod';

export const loginTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number(),
});

export const loginErrorResponseSchema = z.object({
  error: z.string().min(1),
});

export const unauthorizedResponseSchema = z.object({
  message: z.string().min(1),
});

export type LoginTokenResponse = z.infer<typeof loginTokenResponseSchema>;
export type LoginErrorResponse = z.infer<typeof loginErrorResponseSchema>;
export type UnauthorizedResponse = z.infer<typeof unauthorizedResponseSchema>;
