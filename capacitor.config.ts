import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'BusBuddy Tracker',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    useLegacyBridge: true // Aggiungi questa riga per abilitare l'opzione useLegacyBridge
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
