import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.isfia.app',
  appName: 'ISF IA',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#000000',
    // allowMixedContent removido por segurança
    // Permite apenas conteúdo HTTPS, prevenindo ataques Man-in-the-Middle
    // Necessário para aprovação no Google Play Store
  },
  // Removido buildOptions para evitar conflito com build.gradle
  // A assinatura será gerenciada diretamente no android/app/build.gradle
};

export default config;
