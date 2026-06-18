/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#D4AF37',
        'brand-dark': '#0B0D12'
      }
    },
  },
  plugins: [],
}
