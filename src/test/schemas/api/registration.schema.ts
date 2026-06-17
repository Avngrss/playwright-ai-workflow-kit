import { z } from 'zod';

export const userAddressSchema = z.object({
  street: z.string().nullable().optional(),
  house_number: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
});

export const userResponseSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  address: userAddressSchema.optional(),
  phone: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  email: z.string(),
  id: z.string().min(1),
  provider: z.string().nullable().optional(),
  totp_enabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
  failed_login_attempts: z.number().int().nullable().optional(),
  created_at: z.string().min(1),
});

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

export type UserResponse = z.infer<typeof userResponseSchema>;
export type DuplicateConflictResponse = z.infer<typeof duplicateConflictResponseSchema>;
export type RegistrationValidationErrorResponse = z.infer<
  typeof registrationValidationErrorResponseSchema
>;
