// @ts-check
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import pagefind from 'astro-pagefind'
import { unified } from '@astrojs/markdown-remark'
import { rehypeTrimTaskListLabels } from './src/lib/rehype-task-list.mjs'

// Static site output (default). `astro build` -> ./dist
export default defineConfig({
  site: 'https://me.feziv.ru',
  // Blog lives at `/`; keep old `/blog` links working.
  redirects: {
    '/blog': '/',
  },
  // Astro 6: pass plugins to the unified() processor (gfm/highlighting stay on).
  markdown: {
    processor: unified({ rehypePlugins: [rehypeTrimTaskListLabels] }),
  },
  // `pagefind()` runs indexing on build and serves /pagefind in dev & preview.
  integrations: [mdx(), sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
})
