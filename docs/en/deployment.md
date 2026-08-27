# Deployment

How MD·PRESS reaches production, and how to verify a deployment.
中文版：[部署](../zh/deployment.md)。

## Current Production Setup (verified 2026-08-27)

The live site at https://petrel2015.github.io/markdown-press/ is served by
**GitHub Pages**:

| Setting | Value (from the GitHub Pages API) |
|---------|-----------------------------------|
| Source | `main` branch, root path (`/`) |
| Build type | `legacy` (branch deployment — no CI workflow involved) |
| HTTPS | enforced |
| Status | `built` |

There is no `.github/workflows/` directory and no build step — deployment is
simply: **push to `main`, Pages serves the repository root**.

## Enabling Pages for a Fork

1. Push the repository to GitHub.
2. Settings → Pages → Build and deployment → Source: **Deploy from a
   branch**.
3. Branch: `main`, folder: `/ (root)` → Save.
4. Wait for the first build; the URL appears on the same settings page and
   is `https://<owner>.github.io/<repo>/`.

## Why the Code Is Subpath-Safe

GitHub Pages project sites are served under `/<repo>/`, not at a domain
root. MD·PRESS is written for that constraint:

- Every asset reference in `index.html` is relative (`vendor/…`, `css/…`,
  `js/…`).
- The mermaid lazy-loader injects the relative URL
  `vendor/mermaid.min.js`, so it resolves under any base path.
- No absolute `/…` links exist in the app markup.

This was verified locally by serving the repository under a `/markdown-press/`
prefix and walking the full UI in headless Chromium with zero console errors
(the same run produced the screenshots in `docs/img/`).

Subpath hosting requires **no configuration** in this project — there are no
base-path settings, env vars or build-time rewrites, because there is no
build.

## Custom Domain

Not configured in this project. GitHub Pages custom domains work
independently of the application code (CNAME record + repository setting);
nothing in MD·PRESS needs to change since all references are relative.

## Post-Deployment Verification Checklist

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://<owner>.github.io/<repo>/          # expect 200
curl -s -o /dev/null -w "%{http_code}\n" https://<owner>.github.io/<repo>/vendor/marked.min.js   # expect 200
```

Then in a browser:

1. Open the site; the sample document renders with its Mermaid flowchart
   (confirms the lazy `vendor/mermaid.min.js` load resolves under the
   subpath).
2. Switch language, toggle a view mode, run one PNG export — each exercises
   a different module at the deployed URL.
3. Check the browser console: zero errors is the healthy state.

## What Deployment Does Not Cover

- No CI runs tests on push. Run `cd test && npm install && npm test` locally
  before pushing (65/65 passing as of 2026-08-27).
- No release/tag automation exists; see the versioning note in
  [CHANGELOG](../../CHANGELOG.md).
