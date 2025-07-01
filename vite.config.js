import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          charts: ['chart.js', 'vue-chartjs']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.VUE_APP_DEMO_MODE': '"true"'
  }
})
