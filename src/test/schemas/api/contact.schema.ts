import { z } from 'zod';

export const contactSendMessageResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string(),
  subject: z.string(),
  message: z.string(),
  status: z.string().min(1),
  created_at: z.string().min(1),
});

export const contactValidationErrorResponseSchema = z
  .record(z.string(), z.array(z.string().min(1)).min(1))
  .refine(
    (value) => Object.keys(value).length > 0,
    'Contact validation-error response must include at least one field.',
  );

export type ContactSendMessageResponse = z.infer<typeof contactSendMessageResponseSchema>;
export type ContactValidationErrorResponse = z.infer<
  typeof contactValidationErrorResponseSchema
>;
