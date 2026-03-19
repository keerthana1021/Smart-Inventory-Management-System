import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico'],
            manifest: {
                name: 'Smart Inventory Management',
                short_name: 'Smart Inventory',
                description: 'Inventory management system - track products, orders, and stock',
                theme_color: '#1e293b',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    { src: '/vite.svg', sizes: 'any', type: 'image/svg+xml' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } } }
                ]
            }
        })
    ],
    server: {
        port: 3000,
        proxy: {
            '/api': { target: 'http://localhost:8080', changeOrigin: true },
            '/v3': { target: 'http://localhost:8080', changeOrigin: true },
            '/swagger-ui': { target: 'http://localhost:8080', changeOrigin: true },
        },
    },
});
