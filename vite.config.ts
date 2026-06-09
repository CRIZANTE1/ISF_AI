import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    host: '0.0.0.0', // Permite acesso de qualquer IP na rede
    port: 5173,
    strictPort: false, // Se a porta estiver ocupada, tenta outra
  },
  
  optimizeDeps: {
    exclude: [
      'lucide-react',
      '@capacitor/core',
      '@capacitor/filesystem',
      '@capacitor/share',
      '@sentry/react',
    ],
    include: ['three', '@react-three/fiber'],
  },
});
