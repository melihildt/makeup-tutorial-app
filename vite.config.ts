import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // Binds to 0.0.0.0 (not just localhost) so a phone on the same WiFi
    // network can reach the dev server via the Mac's LAN IP, for testing
    // real mobile browser chrome (address bar / toolbar) that a desktop
    // browser's device emulation can't reproduce.
    host: true,
  },
})
