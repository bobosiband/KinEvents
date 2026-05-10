import dotenv from 'dotenv'
import { z } from 'zod'

// Only load `.env` if core env vars are missing. This prevents a local
// `.env` from overriding explicit SAM/local env-vars or CI settings.
if (!process.env.NODE_ENV && !process.env.MONGODB_URI && !process.env.JWT_SECRET) {
  dotenv.config()
}

const requiredVariables = ['NODE_ENV', 'JWT_SECRET', 'SENDGRID_API_KEY', 'APP_URL'] as const

for (const variableName of requiredVariables) {
  if (!process.env[variableName] || process.env[variableName]?.trim() === '') {
    throw new Error(`Missing required environment variable: ${variableName}`)
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  JWT_SECRET: z.string().min(1),
  SENDGRID_API_KEY: z.string().min(1),
  APP_URL: z.string().url(),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB_NAME: z.string().min(1).default('kinevents'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM_NAME: z.string().default('KinEvents'),
  EMAIL_ENABLED: z.enum(['true', 'false']).default('true'),
})

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  APP_URL: process.env.APP_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  EMAIL_ENABLED: process.env.EMAIL_ENABLED,
})