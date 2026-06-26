import { z } from 'zod';

export const duplicateConflictMessageSchema = z.object({
  message: z.string(),
});

export const duplicateConflictFieldErrorsSchema = z
  .record(z.string(), z.array(z.string()))
  .refine(
    (value) => Object.keys(value).length > 0,
    'Duplicate conflict field-errors response must include at least one field.',
  );

export const duplicateConflictResponseSchema = z.union([
  duplicateConflictMessageSchema,
  duplicateConflictFieldErrorsSchema,
]);

export const registrationValidationErrorResponseSchema = z
  .record(z.string(), z.array(z.string().min(1)).min(1))
  .refine(
    (value) => Object.keys(value).length > 0,
    'Registration validation-error response must include at least one field.',
  );

export type DuplicateConflictResponse = z.infer<typeof duplicateConflictResponseSchema>;
export type RegistrationValidationErrorResponse = z.infer<
  typeof registrationValidationErrorResponseSchema
>;
