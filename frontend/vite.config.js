import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBase(value) {
  const trimmed = String(value || '/').trim()
  if (!trimmed || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const base = normalizeBase(env.VITE_PUBLIC_BASE_PATH)
  const basePrefix = base === '/' ? '' : base.replace(/\/$/, '')
  const auroraProxyPath = `${basePrefix}/aurora-api` || '/aurora-api'

  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.LUNAR_API_TARGET || 'http://localhost:8000', changeOrigin: true },
        [auroraProxyPath]: {
          target: env.AURORA_PEOPLE_API_TARGET || 'http://localhost:4173',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${auroraProxyPath}`), ''),
        },
      },
    },
  }
})
