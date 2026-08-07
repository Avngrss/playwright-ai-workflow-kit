import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1),
  expires_in: z.number().positive(),
});

export type LoginTokenResponse = z.infer<typeof loginTokenResponseSchema>;
