const path = require('path');
const fs = require('fs');

const adminEnv = path.resolve(__dirname, '../admin-portal/.env.local');
const mobileEnv = path.resolve(__dirname, '.env');
const mergedEnvPath = path.resolve(__dirname, '.env.babel.merged');

/**
 * `.env.babel.merged` is generated here whenever Metro/Babel loads this file.
 * Do not edit it by hand — your changes are overwritten on the next dev-server start.
 *
 * react-native-dotenv only reads one file. We need both:
 * - admin-portal/.env.local — NEXT_PUBLIC_SUPABASE_* (same as Next.js)
 * - mobile-app/.env — GOOGLE_PLACES_API_KEY, LOCATIONIQ_API_KEY, etc.
 * If only admin existed, mobile-only keys were dropped and address autocomplete broke.
 *
 * Mobile keys with empty values must NOT overwrite admin (e.g. placeholder SUPABASE_* in
 * .env.example would wipe NEXT_PUBLIC_* from admin-portal/.env.local and force demo mode).
 */
function loadMergedEnvPath() {
  let parse;
  try {
    parse = require('dotenv').parse;
  } catch {
    return fs.existsSync(adminEnv) ? adminEnv : mobileEnv;
  }

  const merged = {};
  if (fs.existsSync(adminEnv)) {
    Object.assign(merged, parse(fs.readFileSync(adminEnv, 'utf8')));
  }
  if (fs.existsSync(mobileEnv)) {
    const mobileParsed = parse(fs.readFileSync(mobileEnv, 'utf8'));
    for (const [key, val] of Object.entries(mobileParsed)) {
      if (String(val ?? '').trim() !== '') {
        merged[key] = val;
      }
    }
  }

  if (Object.keys(merged).length === 0) {
    return fs.existsSync(adminEnv) ? adminEnv : mobileEnv;
  }

  const lines = Object.keys(merged)
    .sort()
    .map(key => {
      const v = merged[key];
      if (v === undefined) return null;
      const val = String(v);
      if (/[\r\n]/.test(val)) {
        return `${key}="${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      }
      if (/[\s#"']/.test(val) || val === '') {
        return `${key}="${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      }
      return `${key}=${val}`;
    })
    .filter(Boolean);

  const nextContent = `${lines.join('\n')}\n`;
  let prev = '';
  try {
    prev = fs.readFileSync(mergedEnvPath, 'utf8');
  } catch {
    /* no file */
  }
  if (prev !== nextContent) {
    fs.writeFileSync(mergedEnvPath, nextContent, 'utf8');
  }

  return mergedEnvPath;
}

const envPath = loadMergedEnvPath();

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
