// @ts-check
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import pagefind from 'astro-pagefind'

// Static site output (default). `astro build` -> ./dist
export default defineConfig({
  site: 'https://me.feziv.ru',
  // Blog lives at `/`; keep old `/blog` links working.
  redirects: {
    '/blog': '/',
  },
  // `pagefind()` runs indexing on build and serves /pagefind in dev & preview.
  integrations: [mdx(), sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
})
