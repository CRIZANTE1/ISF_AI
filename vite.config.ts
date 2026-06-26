import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const hasGoogleServices = fs.existsSync(
  path.resolve(__dirname, 'android/app/google-services.json'),
);
const hasGoogleServiceInfo = fs.existsSync(
  path.resolve(__dirname, 'ios/App/App/GoogleService-Info.plist'),
);
const hasFirebasePushConfig = hasGoogleServices || hasGoogleServiceInfo;

export default defineConfig({
  define: {
    'import.meta.env.VITE_HAS_GOOGLE_SERVICES': JSON.stringify(
      hasFirebasePushConfig ? 'true' : 'false',
    ),
  },
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
