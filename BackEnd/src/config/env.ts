import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

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
})

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  APP_URL: process.env.APP_URL,
})