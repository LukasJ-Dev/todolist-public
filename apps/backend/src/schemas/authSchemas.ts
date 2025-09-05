import { z } from 'zod';

export const signupBody = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((s) => s.trim()),
  email: z
    .string()
    .email()
    .transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

export const loginBody = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});
