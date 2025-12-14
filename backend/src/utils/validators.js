const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits')
});

const jobTextSchema = z.object({
  text: z.string().min(50, 'Job description must be at least 50 characters').max(10000)
});

module.exports = {
  registerSchema,
  loginSchema,
  otpSchema,
  jobTextSchema
};