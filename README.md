# Twoism

An Astro template for a short intro and a list of notes. Named after the 1995 Boards of Canada EP.

Demo: [twoism.pages.dev](https://twoism.pages.dev)

## Preview

| Light | Dark |
| --- | --- |
| ![Home page in light mode](.github/assets/home-light.webp) | ![Home page in dark mode](.github/assets/home-dark.webp) |
| ![A note in light mode](.github/assets/note-light.webp) | ![A note in dark mode](.github/assets/note-dark.webp) |

## Start

```sh
bun create astro@latest --template esafev/twoism
bun run dev
```

## Customize

Your name, links and site URL live in `src/consts.ts`, the intro in `src/content/intro.mdx`, notes in `src/content/notes`.

## Scripts

```sh
bun run note:create "Title" "Description"   # draft note
bun run portrait:create photo.jpg           # dithered portrait, macOS
bun run image:dither photo.jpg              # dithered image for a note
```
