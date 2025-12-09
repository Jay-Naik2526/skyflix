import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <--- ADDS THIS: Forces it to listen on all IPs
    port: 5173, // <--- ADDS THIS: Locks the port to 5173
  }
})