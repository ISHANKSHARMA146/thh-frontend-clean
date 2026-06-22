// Type-safe, validated environment variables. Copy to: src/env.ts
// Import `env` from here instead of touching process.env directly — invalid/missing
// vars fail fast at boot with a clear error, and required vars are documented in code.
//
// Requires: @t3-oss/env-nextjs, zod
// Usage: import { env } from '@/env'
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  // Server-only secrets — NEVER exposed to the browser, no NEXT_PUBLIC_ prefix.
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    // DATABASE_URL: z.string().url(),
    // EMAIL_SERVER: z.string().min(1),
    // add server-only secrets here
  },

  // Client vars — MUST be prefixed NEXT_PUBLIC_ and are safe to expose.
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    // add NEXT_PUBLIC_* here
  },

  // Next.js only inlines NEXT_PUBLIC_ vars, so list the client ones explicitly.
  // (Server vars are read from process.env automatically.)
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },

  // Treat empty strings as undefined so optional() works as expected.
  emptyStringAsUndefined: true,
})
