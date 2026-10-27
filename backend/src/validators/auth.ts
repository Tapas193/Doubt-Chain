import { z } from 'zod'

const professionEnum = z.enum(['STUDENT', 'PROFESSOR', 'CORPORATE_WORKER'])

const registerBody = z
  .object({
    fullName: z.string().trim().min(1).max(80),
    profession: professionEnum,
    identificationNumber: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9\-_]+$/),
    email: z
      .string()
      .trim()
      .email()
      .transform((e) => e.toLowerCase()),
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

export const registerSchema = registerBody

export const registerBodySchema = registerBody

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1)
})

export const loginBodySchema = loginSchema
