import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the app from https://tato22-alt.github.io/gestor-postulaciones-it/,
  // so production assets need that prefix. The dev server keeps the root path.
  base: command === 'build' ? '/gestor-postulaciones-it/' : '/',
}))
