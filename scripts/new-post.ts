#!/usr/bin/env bun
// Scaffold a new blog post: `bun run new "My Post Title"`
// Creates src/content/blog/YYYY-MM-DD-<slug>.md with today's date prefilled.

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const title = process.argv.slice(2).join(' ').trim()

if (!title) {
  console.error('Usage: bun run new "My Post Title"')
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
const filePath = join(dir, `${date}-${slug}.md`)

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
