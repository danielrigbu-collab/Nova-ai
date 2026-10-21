import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.devcraftai.app',
  appName: 'DevCraft AI',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
