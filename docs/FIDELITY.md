# Cinematic fidelity rework

The previous implementation retained colors and typography but lost the approved experience. This rework was compared directly in Chrome with `portfolio-handoff/design-reference.html`, including next/previous scenes, the index switch and project details. The reference file was not modified. For DOM measurements, the comparison script temporarily relaxed the preview iframe’s opaque sandbox in that browser instance and reloaded the same authored document; the production site does not ship the wrapper or iframe.

## What was lost and what changed

| Area | Previous implementation | Reworked implementation |
| --- | --- | --- |
| Opening | Independent CSS name/copy/gallery animations | One coordinated sequence for staggered name, surname, copy, cobalt curtain and first-project rail reveal; first input cancels the sequence cleanly |
| Reel layout | Split art/text cards; mobile cards measured about 701px high | Full-bleed art-directed scenes, partial neighboring previews; 460px desktop / 420px mobile, matching the reference’s scene heights |
| Movement | Jump on pointer release; no wheel movement | Live pointer-following drag with edge resistance; touch swipe, vertical wheel and horizontal trackpad; arrows, keyboard, Home/End |
| Active-project feedback | Counter only | Title, caption, project action, dots, active scene background and foreground update together |
| Index | Absent | Reel/index toggle; selecting an index entry returns to its scene and focuses its detail action |
| Art | Repeated numbered rectangles and small interface images | Operations routing, family information cards, textile/commerce composition, animated indoor route, workforce-access columns and context/memory sheets; authentic screenshots retain their colors |
| Reveals | Similar title entrance everywhere | Distinct art-layer staggering, textile movement, card/sheet fans, route drawing and position marker; reduced motion cancels movement |
| Project details | All copy permanently beside art; no detail transition | Shared native modal with polished entrance/exit, scrollable content, verified actions, focus containment/return, Escape and reduced-motion behavior |
| Continuation | Additional cards interrupted profile → contact | Synchronized caption → editorial profile → cobalt contact, following the reference sequence; earlier projects remain in the complete catalogue |

AutoOps and StaffSync retain verified interface palettes. Vilvia, Sukna, BeetlSense and AR&MF use explicitly labeled neutral concepts where official branding has not been established. The artwork explains purpose without implying invented screens, client assets or measured results.

## Every route

- **Home:** restores the reference’s defining cinematic sequence and interactions, while retaining the brief’s six-project order and all four navigation destinations.
- **Projects:** remains the complete automatic GitHub catalogue, including unknown repositories. All entries can open the same accessible detail interaction; real site/code actions remain separate. The catalogue is not constrained by home curation.
- **Skills:** keeps the editorial typography, compact shared header and cobalt contact ending; headings and experience/toolkit sections enter with restrained motion. The reference has no separate Skills route, so its profile visual language is extended here.
- **Contact:** retains every field, direct contact alternative and the existing endpoint. Shared entrance motion and typography connect it to the composition; submission/reset/error behavior is unchanged. The reference’s contact section is extended into a functional page rather than substituted for the form.

## Verification and deliberate adaptations

`scripts/compare-reference.mjs` records reference and implementation screenshots/measurements at 1440px and 390px. Before/after measurements are saved separately. All four real routes have no horizontal overflow. The reference wrapper’s outer padding is not copied into production.

`scripts/fidelity-check.mjs` captures opening phases, all six scenes and all six detail views at desktop/mobile widths. It checks synchronized captions, neighboring previews, pointer-following movement before release, wheel/trackpad navigation, upward/downward boundary escape, touch swipe, keyboard/index navigation, native background inertness, close/focus restoration and reduced motion. Files are written to the OS temp directory `portfolio-fidelity`, outside deployment output.

The reference’s local simulated overlay is implemented as a real native dialog. On mobile it fills the viewport and keeps the close action and project links available while details scroll; this preserves the reveal interaction with correct modal behavior. Wheel handling releases at both ends before checking its transition lock, and Shift+wheel always passes through, avoiding the reference’s potential scrolling trap. These are intentional accessibility/scrolling adaptations, not omitted interaction types.

The discovery/contact regression suite is retained, including the browser fixture that renders `brand-new-unlisted-tool` without curated metadata. No dependencies, repository allowlist, persistent cache, deployment, email delivery or external write was introduced. No handoff files are served or included in deployment packaging.

## Final results

| Chrome viewport | Opening sequence | Six scenes and captions | Six detail open/close/focus cycles | Drag, wheel, trackpad, touch, keys | Both scroll exits | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| 1440px | Passed | Passed | Passed | Passed | Passed | Passed |
| 390px | Passed | Passed | Passed | Passed | Passed | Passed |
| 320px | Passed | Passed | Passed | Passed | Passed | Passed |

The fidelity run completed with no uncaught exceptions or console errors. The full browser regression also passed every route at all three widths, the uncurated-repository fixture (including safe project-detail rendering), progressive reveal, partial/empty/total failure states, retry, and mocked contact success/failure/duplicate handling. Live GitHub returned 14 public repositories. `npm test`: 13 passed. `npm run check`: 21 JavaScript files and JSON configuration passed. `git diff --check`: passed.

The actual reference and the real pages were viewed side by side through captured desktop/mobile layouts, and opening phases, scene changes and detail transitions were captured separately. Before/after comparison JSON and `fidelity-results.json` sit alongside those captures in `%TEMP%/portfolio-fidelity`. No requested interaction type remains unimplemented. Physical-device testing and pixel-identical reproduction of the preview wrapper are not claimed.
