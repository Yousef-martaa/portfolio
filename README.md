# Yousef Martaa — portfolio

Four static HTML pages, shared CSS and native browser JavaScript modules. No frontend build step, framework migration or new dependencies. GitHub projects load directly in the visitor’s browser; `api/contact.js` is a separate CommonJS serverless function using Nodemailer.

## Local preview and checks

```sh
npm ci
npm test
npm run check
npm run preview
```

Open **http://127.0.0.1:8765/**. Routes: `/` (also `/index.html`), `/projects.html`, `/skills.html`, `/contact.html`. Set `PORT` to change the port.

`npm run preview` serves only `public/`, plus an explicit 503 response for contact POSTs. **It never sends email and does not emulate the deployed function.** Use `npm run preview:mock` to exercise form success: it validates fields and returns a mock response without SMTP. Run only one preview command per port.

`npm test` covers discovery, safe rendering/link selection, contact validation and mocked SMTP success/failure, routes and deployment exclusion. `npm run check` syntax-checks JavaScript and validates JSON.

Optional real-browser checks: start isolated headless Chrome with `--remote-debugging-port=9223` and a temporary `--user-data-dir`, run `npm run preview:mock`, then `node scripts/browser-check.mjs`. This uses Chrome DevTools without a browser-test dependency. It checks routes at 1440/390/320px, keyboard/touch/scroll/reduced motion, discovery fixtures and mock contact interactions. Screenshots/results go to the OS temp folder `portfolio-cobalt-validation`. Chrome and a WebSocket-capable Node runtime (Node 22 used here) are required. Run `node scripts/interaction-check.mjs` against the same preview/browser for focused first/middle/last vertical scrolling, horizontal wheel and drag, hint dismissal, native cursors, vertical/diagonal touch, dialog focus and reduced-motion checks at 1440/390/320px.

## Automatic GitHub discovery

`public/discovery.mjs` discovers every eligible public repository from `Yousef-martaa` and the account’s public organizations on each Projects visit/reload. Pagination covers user repositories, organizations and every organization’s repositories. Forks/private data are excluded; archived/disabled/template repositories remain with status labels. Results deduplicate by numeric repository ID and sort globally by `updated_at` descending, then `full_name` ascending.

At most three organization chains run concurrently. Requests time out after 12 seconds. Failed pages retain completed results; loading, empty, partial and total-error messages provide a GitHub fallback and Retry when needed. Rate limits stop the affected chain with a useful message; there is no automatic retry loop. Only a page-local shared promise is used, with normal HTTP caching. No persistent cache, token, build-time catalogue, service worker or manual refresh requirement is introduced.

The catalogue progressively reveals 12 entries at a time. Every eligible entry stays available through “Show more”. Organization ownership does not assume personal contribution.

## Editorial content, assets and links

`public/project-data.mjs` holds optional descriptions, verified full `owner/repo` identities, home order, screenshot paths and palettes. **It is not an allowlist.** Unknown repositories automatically get a neutral concept cover, name, description, language and repository link. A new public repository requires no metadata edit or rebuild.

Home order: AutoOps, Vilvia, Sukna Collection, BeetlSense, StaffSync, AR&MF. CV-backed overviews without established public repositories remain separate case studies, without invented code links. Existing featured work remains represented. Both pages use `public/projects.mjs` for normalization/link selection and `public/render.mjs` for safe DOM construction.

The cinematic experience lives in `public/reel.mjs` and `public/cinematic.css`: one opening timeline, full-bleed scenes, pointer dragging, touch, horizontal trackpad input, arrows, keyboard, a reel/index switch and synchronized captions. Vertical wheel input scrolls the page at every slide. Clearly horizontal trackpad input navigates the reel; Ctrl/Shift+wheel bypass it. A small control-side hint disappears after the first drag that changes projects. `public/cover-art.mjs` defines purpose-specific concept compositions alongside authentic screenshots. `public/project-details.mjs` provides the shared native modal on Home and Projects, including focus containment/return, Escape and reduced-motion transitions. Skills and Contact share page/section entrance motion through `public/page-motion.mjs`.

For direct design verification, run `node scripts/compare-reference.mjs` (baseline) or set `COMPARISON_PHASE=after` for the updated comparison. It opens the actual local `portfolio-handoff/design-reference.html` in Chrome and compares every route at 1440/390px. `node scripts/fidelity-check.mjs` captures opening phases and every project/detail view at 1440/390/320px, checking live drag, wheel/trackpad, boundary release, touch, keyboard, the index switch, caption synchronization, modal focus and reduced motion. These scripts need the same isolated Chrome/preview setup as the browser checks; output stays in the OS temp directory `portfolio-fidelity`.

Link order: verified explicit site override → valid project-specific GitHub homepage → public repository. Site/code actions remain distinct. Only HTTP(S) destinations without credentials are accepted; obvious repository/profile, badge and documentation URLs are not deployed-app actions. Repository owners supply homepage metadata; URL syntax alone does not prove availability. No browser HEAD checks or runtime README scraping occur. Provenance, unresolved identities and asset sources: [docs/PROJECT-LINKS.md](docs/PROJECT-LINKS.md).

CV copy follows the user-supplied handoff’s transcription; the original PDF was not in this checkout. Covers are labeled concept illustrations unless showing authentic public interfaces. Screenshots retain original colors. Neutral concepts do not claim official branding. No handoff photograph/reference artwork is shipped.

## Contact and Vercel

POST `/api/contact` accepts JSON `name`, `email`, optional `subject`, and `message`. Required strings, email, types, lengths and header fields are validated. The browser blocks duplicate in-flight submissions and keeps input after failure. Success resets/hides the form and focuses accessible feedback. Email, telephone, GitHub and LinkedIn alternatives remain.

Configure server-only `EMAIL_USER` and `EMAIL_PASS` in Vercel. Gmail SMTP uses TLS on port 465; sender/recipient use `EMAIL_USER`, with the visitor’s email as `replyTo`. Never put credentials in `public/` or commit them. Tests inject a mock transport; no email was sent.

`vercel.json` selects static `public/` output with no framework build. Keep root `api/contact.js` as a Node serverless function. `.vercelignore` excludes `portfolio-handoff/`, docs/tests/preview scripts and environment files from uploads; the local server cannot expose them either. Dashboard overrides and deployed runtime still require verification before future deployment. No push, merge or deployment was performed.


