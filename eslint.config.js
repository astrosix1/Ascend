const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'web-build/**',
      '.expo/**',
      'coverage/**',
      // Deno runtime code (Supabase Edge Functions) — different module
      // resolution and globals (Deno.*) than the Node/RN app; lint it
      // separately with `deno lint` if desired.
      'supabase/functions/**',
    ],
  },
  {
    rules: {
      // console.error/warn are the app's de facto logging layer; console.log
      // left in shipped code is the thing worth catching.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
