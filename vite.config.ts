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
    exclude: ['lucide-react', '@capacitor/core', '@capacitor/push-notifications'],
    include: ['three', '@react-three/fiber'],
  },
});
