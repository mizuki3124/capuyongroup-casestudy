import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'case study',
  webDir: 'www',
  // Needed so the Android app may call the plain-http XAMPP server on your LAN.
  server: { cleartext: true, androidScheme: 'http' },
};

export default config;
