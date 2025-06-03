import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

  ],
})
// frontend/vite.config.js
// frontend/vite.config.js
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
//   build: {
//     outDir: 'dist',
//     emptyOutDir: true,
//     sourcemap: false,
//     rollupOptions: {
//       output: {
//         manualChunks: undefined
//       }
//     }
//   },
//   server: {
//     port: 5173,
//     host: true
//   }
// })
