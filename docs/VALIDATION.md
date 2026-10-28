# Validation — 27 October 2026

Branch: `redesign/cobalt-v2`. Plain HTML/CSS/JavaScript, four routes and POST `/api/contact` retained. Existing untracked `portfolio-handoff/` preserved. Dependencies and lockfile unchanged. No commit, push, merge, deployment or email delivery performed.

## Automated checks

- `npm test`: **13 passed, 0 failed**.
- `npm run check`: **21 JavaScript files passed syntax checks**, JSON configuration valid (including cinematic rework and comparison tools).
- `git diff --check`: passed.
- Route checks: `/`, `/index.html`, `/projects.html`, `/skills.html`, `/contact.html`, scripts, stylesheet and four WebP assets return 200 locally. WebP MIME types verified. Handoff documents, README and hidden environment paths return 404 from the preview.
- Static-preview contact returns 503 intentionally. Mock preview validates input and simulates success without constructing an SMTP transport.
- Serverless handler tests cover missing/malformed JSON, wrong field types, empty required values, invalid email, oversized values, header injection, method rejection, unavailable configuration, mocked Gmail TLS success and generic SMTP failure. No real mail transport ran.

## Automatic-discovery proof

`tests/discovery.test.mjs` creates an API fixture named **brand-new-unlisted-tool**, confirms it is absent from curated metadata, runs discovery → normalization → the actual catalogue renderer and asserts the displayed title, description, language and GitHub link. Its missing homepage falls back to its repository. The fake DOM throws if the renderer attempts `innerHTML`; malicious-looking API text remains literal text.

The browser repeats this with 14 fixture repositories: the uncurated repository appears in the real page, no injected image/script executes, and “Show more” reveals all 14 while moving focus to the first newly revealed heading. No real test repository was created.

Other fixtures cover user-repo pagination, organization-list pagination, organization-repo pagination, global sort, ID deduplication, fork/private exclusion, archive/disabled/template preservation, full-identity metadata matching, URL validation, timeout, rate limits, malformed response shape, pagination cycles/foreign destinations, partial-result retention and three-worker organization concurrency.

## Actual browser verification

Chrome 156 via DevTools protocol, using `scripts/browser-check.mjs` against `npm run preview:mock`:

| Check | Result |
| --- | --- |
| All four pages at 1440px, 390px, 320px | Passed; no horizontal document overflow |
| Live GitHub discovery | 14 eligible public repositories; successful state at all three widths |
| Navigation targets | At least 44px wide and 44px high in the final measurements |
| Reel keyboard/arrows | Passed; active slide updates |
| Real emulated touch swipe | Passed; swipe advances the reel |
| Inactive slide focus | Inert and hidden from accessibility tree |
| Wheel / trackpad | Navigates within the gallery; first/last slide release scrolling, Shift+wheel bypasses navigation |
| Reduced motion | Name animation disabled; reel transition duration 0s |
| Partial/empty/total-error UI | Passed with deterministic browser fixtures |
| Retry recovery | Both partial and total failures recover |
| Contact failure/duplicate handling | One request; input retained; submit button restored |
| Contact mock success | Form reset/hidden; accessible status focused |
| JavaScript console | No uncaught exceptions or `console.error` calls |

Desktop Home/Skills and mobile Home/Projects/Contact screenshots were visually inspected, alongside automated layout measurements on every page. Screenshots and machine-readable regression results are in the OS temporary directory `portfolio-cobalt-validation`; they are not deployed. The subsequent cinematic rework is compared directly with the actual reference in `portfolio-fidelity`; see [FIDELITY.md](FIDELITY.md). Tests use desktop Chrome emulation, not physical iOS/Android devices.

## Public project verification

AutoOps, StaffSync, Vägen till Vegan and Mogges Store returned HTTP 200 and showed matching public interfaces. Authentic screenshots were captured without signing in or submitting any action; four optimized WebP files total 142,298 bytes. Public repository identities are established for StaffSync, AR&MF, Vägen till Vegan, Mogges Store and Mental-Health-Chatbot. See [PROJECT-LINKS.md](PROJECT-LINKS.md) for sources, exact mappings and unresolved identities.

AutoOps, Vilvia, Sukna and BeetlSense still have no established public repository mapping; Sukna’s official client domain is unresolved. Accurate overviews are included without fabricated actions. The original CV PDF was not supplied locally; content follows the brief’s transcription. Actual SMTP delivery and Vercel dashboard/runtime settings remain untested as intended. `.vercelignore` and `public/` output configuration keep handoff material out of deployment packaging.
