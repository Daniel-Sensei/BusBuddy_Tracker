import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'BusBus-Tracker',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    useLegacyBridge: true // Aggiungi questa riga per abilitare l'opzione useLegacyBridge
  }
};

export default config;
