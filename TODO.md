# TODO

Deferred enhancements / ideas (not blocking).

## Rendering

- [ ] **Mermaid diagrams** — Anytype exports Mermaid embeds as ` ```mermaid ` code
      blocks. Add a renderer (e.g. `rehype-mermaid`, or a client-side mermaid
      script) so they draw on the page instead of showing as code.
- [ ] **LaTeX / math** — Anytype exports LaTeX as math. Add `remark-math` +
      `rehype-katex` (+ KaTeX CSS) so formulas render. Wire into the
      `unified({ remarkPlugins, rehypePlugins })` processor in `astro.config.mjs`.

## Sync (Anytype)

- [x] **Deletion sync** — `bun run sync:anytype` deletes synced `.md` whose slug is
      no longer in Anytype (only `.md`; `.mdx` are always left alone). Old posts
      (netfilter, srbija, axfr) were moved to `.mdx`, so they're safe.

## Search

- [ ] Decide search scope. Pagefind currently indexes the whole site (~13 pages).
      Only blog posts carry `data-pagefind-body`, but the integration indexes all
      pages — scope to posts only if results get noisy.

## Optional / nice-to-have

- [ ] Comments — not ported from the old Next site (was giscus). Add if wanted.
- [ ] Analytics — not ported (was umami). Add if wanted.
- [ ] Prettier pass on Anytype-synced markdown for canonical formatting
      (after `cleanMarkdown`, before write) — only if you want tidy source.

## Notes

- Content source split: `.md` = synced from Anytype (`bun run sync:anytype`),
  `.mdx` = hand-authored (components/JSX); the sync never overwrites `.mdx`.
- After changing Astro config / markdown plugins: `rm -rf .astro dist && bun run build`
  (content cache doesn't invalidate on config changes).
