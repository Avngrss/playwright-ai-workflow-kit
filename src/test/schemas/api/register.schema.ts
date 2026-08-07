import { z } from "zod";

export const registerUserRequestSchema = z.object({
  first_name: z.string().max(40),
  last_name: z.string().max(20),
  address: z
    .object({
      street: z.string().max(70),
      house_number: z.string().max(10),
      city: z.string().max(40),
      state: z.string().max(40),
      country: z.string().max(40),
      postal_code: z.string().max(10),
    })
    .optional(),
  phone: z.string().max(24).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  password: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/\d/)
    .regex(/[^A-Za-z0-9]/),
  email: z.string().email().max(256),
});

export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;

export const registerUserResponseSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  address: z
    .object({
      street: z.string().optional(),
      house_number: z.string().nullable().optional(),
      city: z.string().optional(),
      state: z.string().nullable().optional(),
      country: z.string().optional(),
      postal_code: z.string().nullable().optional(),
    })
    .optional(),
  phone: z.string().nullable().optional(),
  dob: z.string().optional(),
  email: z.string().email().max(256),
  id: z.union([z.string().min(1), z.number().int()]),
  provider: z.string().nullable().optional(),
  totp_enabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
  failed_login_attempts: z.number().int().nullable().optional(),
  created_at: z.string().min(1),
});

export type RegisterUserResponse = z.infer<typeof registerUserResponseSchema>;

const conflictFieldMessageBagSchema = z.record(
  z.string(),
  z.array(z.string()),
);
const conflictMessageSchema = z.object({
  message: z.string(),
});

export const registerDuplicateConflictResponseSchema = z.union([
  conflictFieldMessageBagSchema,
  conflictMessageSchema,
]);

export type RegisterDuplicateConflictResponse = z.infer<
  typeof registerDuplicateConflictResponseSchema
>;
