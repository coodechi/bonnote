import { createRequire } from 'node:module'
import { defineConfig } from 'prisma/config'

const loadEnv = createRequire(__filename)
loadEnv('./env.cjs')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node ./node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
