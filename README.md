# Twoism

A minimal Astro site: a short intro and a list of notes. Light and dark themes, RSS, a sitemap and generated Open Graph images.

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
| Colors | `:root` in `src/styles/global.css`, and the OG image colors in `src/pages/og/[...slug].png.ts` |
| Favicon | `public/favicon.svg`, `public/favicon.ico` |
| Font | see [Font](#font) |

### Portrait

Put a square image into `public/` and point `PORTRAIT` at it. It replaces the name at the top of the home page, at 96×96. `dark` is optional and is used in dark mode.

```ts
export const PORTRAIT: { light: string; dark?: string } | undefined = {
  light: '/portrait.webp',
  dark: '/portrait-dark.webp',
};
```

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

Images go into `src/content/notes/assets`. See `src/content/notes/formatting.mdx` for images and everything else a note can contain.

## Font

[JetBrains Mono](https://www.jetbrains.com/lp/mono/), licensed under the SIL Open Font License (`public/fonts/OFL.txt`). To use another font, replace the files in `public/fonts/` and update:

- `@font-face` and `font-family` in `src/styles/global.css`
- the preload in `src/components/Head.astro`
- the font file and name in `src/pages/og/[...slug].png.ts`

## Deploy

`bun run build` type-checks and writes a static site to `dist/`, which any static host can serve.

## License

Code: MIT. Font: SIL Open Font License 1.1.
