const path = require('path');
const fs = require('fs');

// Prefer admin-portal/.env.local (same Supabase as Next.js); fall back to mobile-app/.env
const adminEnv = path.resolve(__dirname, '../admin-portal/.env.local');
const mobileEnv = path.resolve(__dirname, '.env');
const envPath = fs.existsSync(adminEnv) ? adminEnv : mobileEnv;

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: envPath,
        allowUndefined: true,
      },
    ],
  ],
};
