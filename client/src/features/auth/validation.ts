import { z } from 'zod'

const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address').transform((email) => email.toLowerCase())

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').min(2, 'Use at least 2 characters'),
  email: emailSchema,
  password: z.string().min(1, 'Password is required').min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegistrationValues = z.infer<typeof registrationSchema>
