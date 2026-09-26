import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react(), tailwindcss()],
    // The Electron kiosk loads from file:// with hash routing, which needs relative asset paths.
    // Web hosting uses browser routing, where deep links need absolute ones.
    base: env.VITE_ROUTER === 'hash' ? './' : '/',
  }
})
