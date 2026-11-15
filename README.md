# Tamamo admin web UI

The optional admin UI for [Tamamo](../tamamo), a proof-of-work reverse proxy.
It edits the same settings as `tamamo.yaml` and shows traffic statistics. It
runs as its own container next to Tamamo. You can skip it entirely and configure
Tamamo through `tamamo.yaml` alone.

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york, zinc,
dark only), react-router (hash router), TanStack Query, react-hook-form with zod,
sonner, i18next (English, Русский, Українська), and CodeMirror for the YAML editor.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173, proxies /api and /assets to http://localhost:8081
```

Run a Tamamo instance with the admin API on port 8081 first.

## Build and check

```sh
npm run build      # tsc -b, then vite build into dist/
npm run lint       # oxlint
```

## Container

```sh
docker build -t tamamo-webui .
docker run -p 8081:8081 -e TAMAMO_API=http://tamamo:8081 tamamo-webui
```

The image is built on `node:22-alpine` and served by `nginx:1.27-alpine`. nginx
listens on 8081 and proxies these paths to `TAMAMO_API`:

- `/api/`
- `/assets/img/`, `/assets/challenge/`, `/assets/modules/`, `/assets/mascot/`

`/assets/modules/` carries the pages that compiled-in modules ship for the web
UI, and the small script and stylesheet those pages use.

`TAMAMO_API` defaults to `http://tamamo:8081`. The template is
`nginx/default.conf.template`. It sets `Host`, `X-Forwarded-For`,
`X-Forwarded-Proto` and `X-Real-IP` on every proxied request, because the
backend's `admin.domains` check compares the Host header. Uploads may be up to 5 MB.

## Layout

```
src/
  main.tsx, App.tsx, router.tsx, index.css
  lib/
    api.ts            fetch wrapper and typed endpoints (ApiError, onUnauthorized)
    types.ts          types mirroring the backend JSON
    config.ts         normalising the config, global vs site scope helpers
    draft.tsx         DraftProvider: loads /api/config, owns the unsaved draft, save/discard
    draft-context.ts  useDraft(), useScope()
    auth.ts           /api/state query, sign-in notice
    i18n.ts           i18next setup, language list, Intl helpers
    navigation.ts     sidebar groups and routes
    query-client.ts   QueryClient, 401 handling
  components/
    ui/               shadcn components (CLI only)
    app-gate.tsx      setup, sign-in or the app
    app-layout.tsx    sidebar, breadcrumb, Outlet, sign-out
    page-header.tsx, fields.tsx, confirm-type-name-dialog.tsx,
    unsaved-bar.tsx, site-scope-picker.tsx, password-strength.tsx,
    placeholder-page.tsx
  routes/<screen>/index.tsx   one folder per screen
  locales/en.json, ru.json, uk.json
nginx/default.conf.template
```

## Modules

The web UI knows no module in advance. `GET /api/modules` lists the modules
compiled into the backend with the settings each one declares, and
`routes/modules/settings-editor.tsx` builds the form from that list. A module
can also ship its own pages. They are listed in the sidebar under **Module
pages** and shown in a frame by `routes/modules/module-page.tsx`,
which also relays sign-out and the frame's height. To write a module, see the
docs: [Tamamo-docs](https://github.com/foxgirlsorg/Tamamo-docs), section
"Writing modules".

The rate limit, bypass headers and webhooks are not modules. They are cards on
the Protection screen.

## Proxy snippets

**Sites > Use with a proxy** generates a config for nginx, Caddy or Traefik, in
auth mode or reverse proxy mode. The generators are plain functions in
`routes/sites/nginx-config.ts`.

## Saving

Config screens edit one draft of the whole config. Use `useDraft()` to read
`draft` and call `setDraft((d) => { ... })`, which receives a copy to mutate.
The sticky `UnsavedBar` saves with `PUT /api/config`. Protection, Rules and the
checking page use `useScope()` with `SiteScopePicker` to edit either the global
settings or a site's own copy.

## Translations

Strings live in `src/locales/<code>.json`. English is the default and the
fallback, and nothing is detected from the browser. The language is chosen in
Settings, then Interface, and stored in localStorage under `tamamo.lang`.
Placeholders use `{name}`. Plurals use the i18next suffixes (`_one`, `_few`,
`_many`, `_other`). For a count `n`, call `t('key', { count: n, n })`.
