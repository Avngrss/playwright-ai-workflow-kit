import { z } from 'zod';

export const forgotPasswordUpdateResponseSchema = z.object({
  success: z.boolean(),
});

export type ForgotPasswordUpdateResponse = z.infer<
  typeof forgotPasswordUpdateResponseSchema
>;
