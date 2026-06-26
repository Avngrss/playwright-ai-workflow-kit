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

export type UserResponse = z.infer<typeof userResponseSchema>;
