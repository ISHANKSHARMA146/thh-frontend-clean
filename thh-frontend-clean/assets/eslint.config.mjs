// ESLint 9 flat config for Next.js 15 + TypeScript.
// Copy to repo root as: eslint.config.mjs
// Encodes the team conventions so violations auto-flag instead of living in a doc.
//
// Requires (most already present via eslint-config-next):
//   eslint, eslint-config-next, @eslint/eslintrc, typescript-eslint
//   (eslint-config-next bundles eslint-plugin-import + react-hooks)
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    rules: {
      // Types must be real — no escape hatch.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Hooks correctness.
      'react-hooks/exhaustive-deps': 'warn',
      // Keep logs out of shipped code.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Named exports only (greppable, refactor-safe). Exceptions below.
      'import/no-default-export': 'error',
      'import/no-duplicates': 'warn',
    },
  },

  {
    // Next.js *requires* default exports in these locations — allow them here only.
    files: [
      '**/app/**/{page,layout,template,loading,error,not-found,global-error,default,route}.{ts,tsx}',
      '**/app/**/{sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.{ts,tsx}',
      '**/middleware.{ts,tsx}',
      '**/*.config.{js,mjs,ts}',
    ],
    rules: { 'import/no-default-export': 'off' },
  },

  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', 'coverage/**'] },
]

export default config
