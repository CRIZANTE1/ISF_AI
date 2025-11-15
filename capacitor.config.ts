import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.isfia.app',
  appName: 'ISF IA',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Removido buildOptions para evitar conflito com build.gradle
  // A assinatura será gerenciada diretamente no android/app/build.gradle
};

export default config;

