#!/usr/bin/env bun
// @ts-nocheck — standalone Bun glue script (run, not part of the site type-check)
/**
 * Sync posts from Anytype (local API) into src/content/blog as Markdown.
 *
 *   bun run sync:anytype          # write/update md files
 *   bun run sync:anytype --dry    # print what would happen, write nothing
 *
 * The Anytype API is LOCAL: the desktop app must be running on this machine.
 * That is why this is a sync step (run on your machine, commit the md) rather
 * than a build-time loader — so CI / Render builds stay independent of Anytype.
 *
 * Setup (.env or shell):
 *   ANYTYPE_API_KEY=...           # Anytype → Settings → API Keys → create & copy
 *   ANYTYPE_SPACE_ID=...          # the space that holds your posts
 *   ANYTYPE_TYPE_KEY=post         # type key to pull (or use ANYTYPE_COLLECTION_ID)
 *   # ANYTYPE_COLLECTION_ID=...   # alternative: pull a specific collection/list
 *   CLOUDINARY_CLOUD_NAME=dvrzuu1gp
 *   CLOUDINARY_UPLOAD_PRESET=...  # an *unsigned* upload preset in Cloudinary
 *
 * VERIFY against your Anytype version (paths below match API 2025-11-08):
 *   - endpoint paths in `listObjects` / `getMarkdown`
 *   - the relation keys in REL (depend on how your "Post" type is set up)
 */

import { existsSync, readdirSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------- config
const DRY = process.argv.includes("--dry");

const API_URL = process.env.ANYTYPE_API_URL ?? "http://127.0.0.1:31009";
const API_VERSION = process.env.ANYTYPE_API_VERSION ?? "2025-11-08";
const API_KEY = req('ANYTYPE_API_KEY')
const SPACE_ID = req('ANYTYPE_SPACE_ID')
// Pull by type. We match the type by its display NAME and resolve its key
// automatically (custom types have generated keys). Override with ANYTYPE_TYPE_KEY
// if you already know the exact key.
const TYPE_NAME = process.env.ANYTYPE_TYPE_NAME ?? "Blog post";
const TYPE_KEY = process.env.ANYTYPE_TYPE_KEY; // optional, skips name lookup
const COLLECTION_ID = process.env.ANYTYPE_COLLECTION_ID; // optional alternative

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

const OUT_DIR = join("src", "content", "blog");

// Map your Anytype "Post" relation keys -> post frontmatter.
// `name` is the built-in object title; the rest are relations you create.
const REL = {
  description: "description",
  date: "published_date",
  tags: "tags",
  draft: "draft",
  slug: "slug",
};

function req(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing env ${name}`);
    process.exit(1);
  }
  return v;
}

// ---------------------------------------------------------------- api
async function anytype(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Anytype-Version": API_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(
      `Anytype ${init.method ?? "GET"} ${path} -> ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
}

/** Fetch all types in the space and print them. */
async function listTypes(): Promise<any[]> {
  const r = await anytype(`/v1/spaces/${SPACE_ID}/types`)
  const types = r.data ?? r.types ?? []
  console.log(`\nTypes in space (${types.length}):`)
  for (const t of types) console.log(`  - ${t.name}  (key: ${t.key})`)
  console.log("")
  return types
}

/** Resolve a type's key from its display name (custom types have generated keys). */
function resolveTypeKey(types: any[]): string {
  if (TYPE_KEY) return TYPE_KEY
  const match = types.find((t: any) => (t.name ?? "").toLowerCase() === TYPE_NAME.toLowerCase())
  if (!match) {
    throw new Error(`Type "${TYPE_NAME}" not found among the types listed above.`)
  }
  console.log(`Using type "${TYPE_NAME}" -> key "${match.key}"`)
  return match.key
}

/** List the post objects to sync (by collection if set, else by type). */
async function listObjects(types: any[]): Promise<any[]> {
  if (COLLECTION_ID) {
    const r = await anytype(
      `/v1/spaces/${SPACE_ID}/lists/${COLLECTION_ID}/objects`,
    );
    return r.data ?? r.objects ?? [];
  }
  const typeKey = resolveTypeKey(types)
  const r = await anytype(`/v1/spaces/${SPACE_ID}/search`, {
    method: "POST",
    body: JSON.stringify({ types: [typeKey] }),
  });
  return r.data ?? r.objects ?? [];
}

/** Fetch a single object rendered as Markdown. */
async function getMarkdown(objectId: string): Promise<string> {
  const r = await anytype(
    `/v1/spaces/${SPACE_ID}/objects/${objectId}?format=md`,
  );
  return r.object?.markdown ?? r.markdown ?? "";
}

// ---------------------------------------------------------------- helpers
function prop(obj: any, key: string): any {
  const p = (obj.properties ?? []).find(
    (x: any) => x.key === key || x.id === key,
  );
  if (!p) return undefined;
  // Anytype returns the value under a type-specific field; grab the first set one.
  return (
    p.text ??
    p.checkbox ??
    p.date ??
    p.number ??
    p.url ??
    p.email ??
    (p.select && (p.select.name ?? p.select)) ??
    (p.multi_select && p.multi_select.map((t: any) => t.name ?? t)) ??
    (p.objects && p.objects.map((o: any) => o.name ?? o)) ??
    undefined
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-я\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toISODate(v: any): string {
  const d = v ? new Date(v) : new Date();
  return Number.isNaN(d.valueOf())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

function yamlList(arr: string[]): string {
  return `[${arr.map((t) => `'${t.replace(/'/g, "''")}'`).join(", ")}]`;
}

// ---------------------------------------------------------------- images -> cloudinary
async function uploadToCloudinary(
  bytes: ArrayBuffer,
  filename: string,
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to upload images",
    );
  }
  const form = new FormData();
  form.append("file", new Blob([bytes]), filename);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: form,
    },
  );
  if (!res.ok)
    throw new Error(
      `Cloudinary upload failed: ${res.status} ${await res.text()}`,
    );
  return (await res.json()).secure_url as string;
}

/** Replace local/Anytype-hosted images in the markdown with Cloudinary URLs. */
async function rehostImages(md: string): Promise<string> {
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...md.matchAll(imgRe)];
  for (const m of matches) {
    const [, , url] = m;
    // Already remote (e.g. existing Cloudinary) — leave it.
    if (/^https?:\/\//i.test(url) && !url.startsWith(API_URL)) continue;
    try {
      const fetchUrl = url.startsWith("http")
        ? url
        : `${API_URL}/${url.replace(/^\.?\//, "")}`;
      const r = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!r.ok) {
        console.warn(
          `  ! could not fetch image ${url} (${r.status}) — leaving as-is`,
        );
        continue;
      }
      const bytes = await r.arrayBuffer();
      const name = url.split("/").pop()?.split("?")[0] || "image";
      const secure = DRY
        ? `<dry-run cloudinary url for ${name}>`
        : await uploadToCloudinary(bytes, name);
      md = md.replace(`](${url})`, `](${secure})`);
      console.log(`  ↑ image ${name} -> ${DRY ? "(dry)" : secure}`);
    } catch (e) {
      console.warn(`  ! image error for ${url}: ${(e as Error).message}`);
    }
  }
  return md;
}

/** Normalise Anytype's markdown export (it uses figure-spaces for indent, etc.). */
function cleanMarkdown(md: string): string {
  return md
    .replace(/[\u200B\uFEFF]/g, "") // zero-width chars -> drop
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ") // exotic spaces -> normal space
    .replace(/[ \t]+$/gm, "") // trailing whitespace (avoids stray <br>)
    .replace(/\n{3,}/g, "\n\n") // collapse extra blank lines
    // keep lists "tight": drop blank lines between list items so the whole
    // list renders consistently (no stray <p> wrapping on some items)
    .replace(/^([ \t]*(?:[-*+]|\d+\.) .*)\n\n(?=[ \t]*(?:[-*+]|\d+\.) )/gm, "$1\n");
}

// ---------------------------------------------------------------- main
async function main() {
  console.log(
    `Anytype sync ${DRY ? "(dry-run) " : ""}from ${API_URL} space ${SPACE_ID}`,
  );
  const types = await listTypes();
  const objects = await listObjects(types);
  console.log(`Found ${objects.length} object(s)`);

  if (!DRY) await mkdir(OUT_DIR, { recursive: true });

  // Hand-authored posts use .mdx and must never be overwritten by the sync.
  const handwritten = existsSync(OUT_DIR)
    ? readdirSync(OUT_DIR).filter((f) => f.endsWith(".mdx"))
    : [];

  // Track slugs that exist in Anytype so we can delete orphaned .md afterwards.
  const syncedSlugs = new Set();

  for (const obj of objects) {
    const title = String(obj.name ?? prop(obj, "name") ?? "").trim();
    const date = toISODate(prop(obj, REL.date));
    const description = (prop(obj, REL.description) as string) ?? "";
    const tags = (prop(obj, REL.tags) as string[]) ?? [];
    const draft = Boolean(prop(obj, REL.draft));

    // Skip empty objects (no title) — avoids junk files like `DATE-.md`.
    if (!title) {
      console.log(`• skip ${obj.id} — empty title`);
      continue;
    }
    const slug = (prop(obj, REL.slug) as string) || slugify(title) || obj.id;
    syncedSlugs.add(slug);

    // Skip if a hand-written .mdx already owns this slug (date prefix ignored).
    if (handwritten.some((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, "") === `${slug}.mdx`)) {
      console.log(`• skip "${slug}" — hand-written .mdx exists`);
      continue;
    }

    let body = await getMarkdown(obj.id);
    body = cleanMarkdown(body);
    body = await rehostImages(body);
    // Drop a leading "# Title" duplicate if Anytype exports one.
    body = body.replace(/^\s*#\s+.*\n+/, "").trim();

    const fm =
      `---\n` +
      `title: '${title.replace(/'/g, "''")}'\n` +
      `description: '${String(description).replace(/'/g, "''")}'\n` +
      `pubDate: '${date}'\n` +
      `tags: ${yamlList(tags)}\n` +
      `draft: ${draft}\n` +
      `---\n\n`;

    const file = join(OUT_DIR, `${date}-${slug}.md`);
    if (DRY) {
      console.log(
        `→ would write ${file}${existsSync(file) ? " (overwrite)" : ""}`,
      );
    } else {
      await writeFile(file, fm + body + "\n", "utf8");
      console.log(`✓ ${file}`);
    }
  }

  // Delete synced .md whose slug no longer exists in Anytype. Only `.md` is
  // touched — hand-authored `.mdx` posts are always left alone.
  const existingMd = existsSync(OUT_DIR)
    ? readdirSync(OUT_DIR).filter((f) => f.endsWith(".md"))
    : [];
  for (const f of existingMd) {
    const slug = f.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
    if (syncedSlugs.has(slug)) continue;
    if (DRY) {
      console.log(`✗ would delete ${f} (not in Anytype)`);
    } else {
      await unlink(join(OUT_DIR, f));
      console.log(`✗ deleted ${f} (not in Anytype)`);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
