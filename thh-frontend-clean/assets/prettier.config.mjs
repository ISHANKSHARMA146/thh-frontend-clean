// Prettier config. Copy to repo root as: prettier.config.mjs
// The important part is the Tailwind plugin — it auto-sorts classes (v4-aware),
// so class order is consistent for free and nobody (human or agent) thinks about it.
//
// Requires: prettier, prettier-plugin-tailwindcss
//
// Style options below are conservative defaults — adjust to match the repo's
// existing style if it already has one (consistency matters more than the values).

/** @type {import('prettier').Config} */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],

  // v4: point the plugin at the CSS entry that has `@import "tailwindcss"` / `@theme`.
  // Adjust the path if your global stylesheet lives elsewhere.
  tailwindStylesheet: './src/app/globals.css',

  // Also sort classes passed into these helpers.
  tailwindFunctions: ['cn', 'cva', 'clsx'],

  // --- optional style prefs (delete if the repo already standardizes these) ---
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
}

export default config
