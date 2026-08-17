import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const configuredBase = env.VITE_PUBLIC_BASE_PATH || '/'
  const base = configuredBase.startsWith('/') ? configuredBase : `/${configuredBase}`
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const apiPrefix = normalizedBase === '/' ? '/api' : `${normalizedBase.replace(/\/$/, '')}/api`

  return {
    base: normalizedBase,
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: ['maultsby.ngrok.io'],
      proxy: {
        [apiPrefix]: {
          target: env.LUNAR_API_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.slice(apiPrefix.length - '/api'.length),
        },
      },
    },
  }
})
