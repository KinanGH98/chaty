import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        sourcemap: true
    },
    server: {
        port: 5173 // Set this to the desired port number
    }
})
