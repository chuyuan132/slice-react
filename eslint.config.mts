import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js, prettier: eslintPluginPrettier },
    extends: ['js/recommended', eslintConfigPrettier],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.jest } },
    rules: {
      'prettier/prettier': 'error'
    }
  },
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
]);
