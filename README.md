# Twoism

A minimal Astro site: a short intro and a list of notes. Light and dark themes, RSS, a sitemap and generated Open Graph images.

Named after the 1995 Boards of Canada EP.

## Start

Requires [Bun](https://bun.sh).

```sh
bun create astro@latest --template esafev/twoism
bun run dev
```

## Make it yours

| What | Where |
| --- | --- |
| Name, description, site URL, footer links | `src/consts.ts` |
| Home page text | `src/content/intro.mdx` |
| Portrait | `PORTRAIT` in `src/consts.ts` |
| Colors | `:root` in `src/styles/global.css`, the OG image colors in `src/pages/og/[...slug].png.ts`, the portrait colors in `scripts/create-portrait.ts` |
| Favicon | `public/favicon.svg`, `public/favicon.ico` |
| Font | see [Font](#font) |

### Portrait

```sh
bun run portrait:create path/to/photo.jpg
```

This turns a photo into a dithered portrait in the site's colors and writes `public/portrait-light.webp` and `public/portrait-dark.webp`. It removes the background with macOS's subject detection and crops around the head. On other systems, use a PNG with a transparent background.

The portrait replaces the name at the top of the home page. To show the name instead, set `PORTRAIT` in `src/consts.ts` to `undefined`.

The sample portrait shows a fictional person, generated with AI.

## Notes

```sh
bun run note:create "A title" "A short description"
```

This creates a draft in `src/content/notes`. Frontmatter:

| Field | |
| --- | --- |
| `title` | |
| `description` | Meta description and RSS summary |
| `pubDate` | |
| `updatedDate` | Optional, shown after the date |
| `slug` | The URL: `/notes/<slug>/` |
| `published` | Drafts (`false`) appear only in `bun run dev` |

Images go into `src/content/notes/assets`. See `src/content/notes/music-is-math.mdx` for images and everything else a note can contain.

## Font

[IBM Plex Mono](https://github.com/IBM/plex), licensed under the SIL Open Font License (`public/fonts/OFL.txt`). To use another font, replace the files in `public/fonts/` and update:

- `@font-face` and `font-family` in `src/styles/global.css`
- the preload in `src/components/Head.astro`
- the font file and name in `src/pages/og/[...slug].png.ts`

## Deploy

`bun run build` type-checks and writes a static site to `dist/`, which any static host can serve.

## License

Code: MIT. Font: SIL Open Font License 1.1.
