import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  server: {
    host: '0.0.0.0', // Permite acesso de qualquer IP na rede
    port: 5173,
    strictPort: false, // Se a porta estiver ocupada, tenta outra
  },
  
  optimizeDeps: {
    exclude: [
      'lucide-react', 
      '@capacitor/core', 
      '@capacitor/push-notifications',
      '@capacitor/filesystem', // Plugin opcional
      '@capacitor/share', // Plugin opcional
      '@sentry/react', // Opcional - só carrega se instalado
    ],
    include: ['three', '@react-three/fiber'],
  },
  
  // Permite imports dinâmicos de módulos opcionais
  build: {
    rollupOptions: {
      external: (id) => {
        // Externaliza plugins do Capacitor que só existem em runtime
        if (id === '@capacitor/push-notifications' || 
            id === '@capacitor/local-notifications' ||
            id.startsWith('@capacitor/push-notifications/') ||
            id.startsWith('@capacitor/local-notifications/')) {
          return true;
        }
        return false;
      },
    },
  },
});
