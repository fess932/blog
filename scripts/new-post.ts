#!/usr/bin/env bun
// @ts-nocheck — standalone Bun glue script (run, not part of the site type-check)
// Scaffold a new blog post: `bun run new "My Post Title" [--mdx]`
// Creates src/content/blog/YYYY-MM-DD-<slug>.{md,mdx} with today's date prefilled.
// Use --mdx for hand-authored posts (components/JSX) — the Anytype sync only
// ever writes .md, so .mdx files are never overwritten.

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const args = process.argv.slice(2)
const useMdx = args.includes('--mdx')
const title = args.filter((a) => !a.startsWith('--')).join(' ').trim()

if (!title) {
  console.error('Usage: bun run new "My Post Title" [--mdx]')
  process.exit(1)
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9а-я\s-]/gi, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')

const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const dir = join('src', 'content', 'blog')
const filePath = join(dir, `${date}-${slug}.${useMdx ? 'mdx' : 'md'}`)

if (existsSync(filePath)) {
  console.error(`✗ Already exists: ${filePath}`)
  process.exit(1)
}

const frontmatter = `---
title: ${title}
description: ''
pubDate: '${date}'
tags: []
draft: true
---

`

await mkdir(dir, { recursive: true })
await writeFile(filePath, frontmatter, 'utf8')
console.log(`✓ Created ${filePath}`)
