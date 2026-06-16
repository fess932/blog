# Feziv — blog & portfolio

Personal blog + portfolio of Ivan Cheremisin. Built with [Astro](https://astro.build)
and [Tailwind CSS](https://tailwindcss.com), runs on [Bun](https://bun.sh).
Output is a fully static site (`astro build` → `dist/`).

## Develop

```sh
bun install
bun run dev      # dev server at http://localhost:4321
bun run build    # static build into ./dist
bun run preview  # serve the built ./dist locally
```

## Structure

```
src/
  consts.ts            site metadata, nav, socials
  data/projects.ts     portfolio projects
  content/blog/        posts (.md / .mdx)
  content.config.ts    blog frontmatter schema
  components/          Header, Footer, cards, icons, theme toggle
  layouts/             BaseLayout, BlogPost
  pages/               index, blog, projects, about, tags, rss.xml
  styles/global.css    Tailwind + prose styles
public/static/         images & favicons
```

## Writing a post

Add a `.md` or `.mdx` file in `src/content/blog/`:

```md
---
title: My post
description: Short summary
pubDate: '2026-01-01'
tags: ['go', 'networks']
draft: false
---

Content…
```

## Deploy

Static host (e.g. Render static site):

- Build command: `bun install && bun run build`
- Publish directory: `dist`
