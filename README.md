<div align="center">

<img src="public/favicon.png" width="120" alt="Eru, the foxgirls.org mascot" />

<h1>TAMAMO WEB UI</h1>

**The optional admin panel for Tamamo.**

[![Docs](https://img.shields.io/badge/Docs-Tamamo--docs-de6161?style=flat-square)](https://foxgirlsorg.github.io/Tamamo-docs/)
[![Image](https://img.shields.io/badge/Image-ghcr.io-de6161?style=flat-square&logo=docker&logoColor=white)](https://github.com/foxgirlsorg/Tamamo-webui/pkgs/container/tamamo-webui)
[![Telegram](https://img.shields.io/badge/Telegram-@foxgirlsorg-de6161?style=flat-square&logo=telegram&logoColor=white)](https://t.me/foxgirlsorg)
[![Website](https://img.shields.io/badge/Website-foxgirls.org-de6161?style=flat-square)](https://foxgirls.org)
[![License](https://img.shields.io/badge/License-MIT-de6161?style=flat-square)](LICENSE)

</div>

---

A settings editor and statistics dashboard for [Tamamo](https://github.com/foxgirlsorg/Tamamo), the proof-of-work reverse proxy. It edits the same settings as `tamamo.yaml`, shows traffic, and previews the checking page live. It runs as its own container next to Tamamo. Drop it and Tamamo keeps working from `tamamo.yaml` alone.

In English, Русский and Українська.

## Run it

Use the web UI compose file from the docs ([Installation](https://foxgirlsorg.github.io/Tamamo-docs/guide/installation)), or run the image yourself:

```bash
docker run -d -p 8081:8081 -e TAMAMO_API=http://tamamo:8081 ghcr.io/foxgirlsorg/tamamo-webui:latest
```

The backend needs `TAMAMO_ENABLE_API=true`. The container is nginx serving the built app. It proxies `/api/` and `/assets/{img,challenge,modules,mascot}/` to `TAMAMO_API` (default `http://tamamo:8081`), so the browser sees one origin.

## Develop

Start a Tamamo backend with the admin API on port 8081, then:

```bash
npm install
npm run dev     # http://localhost:5173, proxies /api and /assets to :8081
npm run build   # tsc -b, then vite build into dist/
npm run lint    # oxlint
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, react-router, TanStack Query, react-hook-form with zod, i18next and CodeMirror.

## How it is put together

- **One draft.** Config screens edit one draft of the whole config (`src/lib/draft.tsx`). The unsaved-changes bar saves it with `PUT /api/config`.
- **Modules.** The UI knows no module in advance. It builds each module's settings form from `GET /api/modules` and shows a module's own pages in a frame.
- **Translations.** Strings live in `src/locales/{en,ru,uk}.json`. English is the default; the language is picked in Settings → Interface.
- **Components.** `src/components/ui/` is managed by the shadcn CLI only.

## Credits

- Made by [foxgirls.org](https://foxgirls.org).
- The mascot is **Eru**, the foxgirls.org mascot. Art by [tr1flu0r1d3.exe](https://t.me/tr1flu0r1d3_exe_art).
- Icons by [Lucide](https://lucide.dev).

---

<div align="center">
  <sub>© 2026 foxgirls.org &nbsp;·&nbsp; MIT License &nbsp;·&nbsp; <a href="https://foxgirls.org">foxgirls.org</a></sub>
</div>
