# Bounce deploy for the retired `soldonamelia` Netlify site

Before soldonameliaisland.com pointed at its current Netlify project, the
domain 301-redirected to the old deployment at `soldonamelia.netlify.app`.
Safari cached that permanent redirect, so some visitors who type the domain
still get replayed a stale redirect to the old address without ever
contacting the live site. The only server that can rescue them is the old
address itself — this folder is what it should serve.

## What's in here

- `netlify.toml` — a forced 302 from every path to
  `https://soldonameliaisland.com/:splat?ref=legacy`, plus `Cache-Control:
  no-store`. It is deliberately a 302 (a 301 would be cached by the very
  browsers this rescues and could never be retired), and the `?ref=legacy`
  query marker is load-bearing: Safari keys its redirect cache on the exact
  URL, so bouncing to the bare apex would hand the visitor straight back to
  their poisoned cache entry in a loop. The marker makes it a different
  cache key.
- `index.html` — meta-refresh fallback, rarely seen because the redirect
  is forced.

## Deploying it

The `soldonamelia` Netlify site has no linked repository, so pick one:

- **Link it to this repo (set-and-forget):** Netlify dashboard →
  `soldonamelia` site → *Site configuration → Build & deploy → Link
  repository* → choose `sold-on-amelia-island`, leave the build command
  blank, set both base and publish directory to `legacy/soldonamelia`.
  Every push to `main` then redeploys the bounce automatically.
- **One-shot CLI:** `netlify deploy --prod --dir legacy/soldonamelia`
  (run `netlify link`/`--site` against the `soldonamelia` site first).
- **Drag-and-drop:** drop this folder onto the site's *Deploys* page.

## Retiring it

Watch for `ref=legacy` in the live site's analytics. When it stops
appearing, no browser is replaying the stale redirect anymore and the
`soldonamelia` site — and this folder — can be deleted.
