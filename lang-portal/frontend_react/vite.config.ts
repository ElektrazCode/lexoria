import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tests must not depend on the machine's time zone (dates are rendered in local time).
process.env.TZ = 'UTC'

// `npm run test:integration` sets INTEGRATION=1 to run only the tests that need the real Go backend.
const integration = process.env.INTEGRATION === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@/foo" -> "<project>/src/foo" (mirrored in tsconfig.app.json for the type checker)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Dev only: the browser calls /api/... on the Vite origin and Vite forwards it to the Go API
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: integration ? ['src/**/*.integration.test.{ts,tsx}'] : ['src/**/*.test.{ts,tsx}'],
    exclude: integration ? [] : ['src/**/*.integration.test.{ts,tsx}', 'node_modules/**'],
  },
})
