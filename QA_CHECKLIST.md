# Full-site QA checklist

Living checklist for the Astro + Supabase rewrite. Grows as each phase ships;
every item added here gets walked through end-to-end (functional + visual,
light + dark, desktop + mobile) in the final full-site run-through before
cutover (Phase 6). Check items off as they're verified in that final pass —
not as each phase ships, since a later phase can regress an earlier one.

## Phase 0 — Architecture skeleton
- [ ] New Astro project builds and deploys to Vercel — code done, deploy pending your Vercel/Supabase account setup (see SETUP.md)
- [ ] Supabase connection works (env vars, client initializes without error) — code done, needs real Supabase project (SETUP.md)
- [x] Firebase Auth admin gate: signed-out visitor is blocked from `/admin` — verified locally (302 to /admin/login)
- [ ] Firebase Auth admin gate: signed-in owner reaches `/admin` — needs a real sign-in to verify (can't test with real credentials from here)
- [x] Public site route renders (even if placeholder content) — verified locally
- [x] Server endpoints reject writes without a valid Firebase session — verified locally (/api/session: 403 without Origin, 400 without idToken)
- [x] `npm run build` + `astro check` both clean

## Phase 1 — Design system port
- [x] Light / dark / auto theme all render correctly, no flash-of-wrong-theme — verified via Playwright screenshots across OS-light/OS-dark × auto/explicit-light/explicit-dark; `data-theme` is set synchronously pre-paint by an inline script in BaseLayout.astro's `<head>`, before any content renders
- [x] Theme toggle persists across reload — verified (`localStorage['portfolio:theme']` survives reload; explicit dark chosen under an OS-light context still reads back `data-theme="dark"` after reload)
- [ ] Font library loads and applies (display + body fonts) — selection mechanism verified (font list highlights the active pick, `--font-display`/`--font-body`/`--font-mono` update, `loadFont()` fires) but this sandbox's outbound network blocks fonts.googleapis.com, so the actual glyph swap wasn't visually observed here — needs a real-network re-check
- [x] Accent color picker changes the live theme correctly — verified (presets + custom-via-ColorPicker both update `--accent-primary`/`--accent-primary-hover`/`--shadow-glow-accent` live, visible immediately on the primary button and swatch)
- [x] ColorPicker: pick a color, clear a color (None), save a color to defaults, remove a saved swatch — all four verified via a dedicated demo (CardTintDemo, originally on the homepage; moved to `/dev/theme-demo` in Phase 4 once "/" became a real Supabase-backed page — since AccentPicker never passes `onClear`)
- [x] ColorPicker: setting RGBA to all zero does not break saving (regression check for the bug fixed pre-rewrite) — verified: typed hex `000000` renders with no page errors; this phase has no save/serialize path yet (presentational only), so this only confirms the picker itself tolerates all-zero, not a Supabase write
- [x] Alta-style card/shadow/radius scale applied consistently across components — verified: `--radius-sm`(4px)/`--radius-md`(8px)/`--radius-lg`(14px)/`--radius-pill` and the soft low-elevation shadow scale are live in `src/styles/theme.css` and visible on the demo cards/inputs/buttons
- [x] No visual regressions vs. the pre-rewrite Portfolio design language — palette, fonts, glassmorphism, pill buttons, and accent system all ported byte-for-byte from `main`; only radius/shadow scale intentionally shrunk per the Alta ask (see Phase 1 commit for the reasoning)

## Phase 2 — Block registry + core blocks + freeform canvas
- [x] Add every block type from the registry at least once; each renders correctly — verified locally (hero, rich-text, image, image-text, button, quote, divider, columns, carousel all present in the demo harness's seed content, plus each addable fresh via the "+ Add block" picker)
- [x] Inline click-to-edit works for text/image fields directly on canvas — verified locally (Playwright: edited a hero heading in place, confirmed the new text persisted)
- [x] Side panel opens for non-inline fields (links, URLs, settings) — verified locally (a button's Link field, a hero's Alignment/Heading size/Text color — none of these are click-to-edit on the canvas itself)
- [x] Freeform drag works; snapping/alignment guides appear and work — verified locally (dragging a block so its edge/center lines up with another block's edge/center shows a guide line and snaps within the threshold; verified both axes)
- [x] Resize handles (Canva/Slides-style) work on all sides + corners, maintain aspect ratio where expected — verified locally (all 8 handles present on selection; corner and side handles both resize correctly; holding Shift on a corner handle preserves aspect ratio within snap-rounding tolerance)
- [x] Nested containers: drag a block into a column/carousel slot and back out — verified locally (Playwright: dragged a top-level block onto a Columns slot, confirmed it replaced the slot's content and the top-level block count dropped by one; used the slot's "pull out" control to extract it back to a top-level block)
- [x] Mobile: pages reflow automatically without a separate mobile-position tab; nothing overlaps or overflows — verified locally (both the editor's mobile-preview toggle and the public renderer at a 380px viewport show every section's blocks stacked full-width in y-order; Columns/Image+Text blocks also switch to a stacked internal layout at that width so nothing is squeezed unreadably narrow)
- [x] Delete/duplicate/reorder a block — verified locally (Playwright: Duplicate increased the block count by one, Send to back changed its zIndex to below the others, Delete removed it)
- [ ] Draft vs. published states behave correctly per page (not site-wide) — wired in Phase 4 (PageEditor.tsx autosaves draft_blocks, a real Publish action copies it to published_blocks); code reviewed and endpoint logic verified (see Phase 4 section below), but needs a real Supabase project to walk end-to-end

## Phase 3 — Motion + Sound
- [x] Magnetic cursor attraction works on intended elements — verified locally (Playwright: moving the cursor near a hero/button/image/etc. block produces a non-identity `translate3d(...) scale(...)` on that block's wrapper, easing back to identity once the cursor moves away; different block types pull at different strengths/polarities per `src/lib/motion/presets.ts` — e.g. the CTA button reaches ~18px of pull near lock-on, the hero heading only a few px, and the quote block has *negative* polarity and gently recedes instead of attracting)
- [x] Repulsion field behaves correctly near the pointer — verified locally (Playwright: sampled the ambient canvas's pixel data in a region, moved the cursor into it, confirmed >4000 pixels changed — the field-line mesh's points visibly ease away from the cursor within their influence radius, per `src/lib/motion/ambientFieldRenderer.ts`)
- [x] Elements-react-to-each-other effect looks right, no jitter/lag — verified locally (Playwright: hovering near the strong-polarity button also measurably nudges the hero/image/quote/columns/carousel blocks elsewhere on the page — a real consequence of the button's own displacement via the coupling pass in `magneticField.ts`, not a canned second animation; magnitudes decay smoothly with distance, no visible jitter)
- [x] Motion layer is present on public site + preview, absent in the editor — verified locally (Playwright: `/dev/canvas-demo`'s Preview-as-visitor mode has the ambient canvas, magnetic nodes, and mute control; Edit mode — including its Mobile-preview toggle, which shares `ReflowedSection` with the public renderer — has zero of any of them; `CanvasEditor.tsx` itself has no diff at all in this phase)
- [x] Motion respects `prefers-reduced-motion` — verified locally (Playwright with `reducedMotion: 'reduce'` emulated: block transforms never leave identity, the rAF loop never starts; a `[data-magnetic-static]` CSS-only hover highlight is used instead; also verified the same fallback engages automatically for a coarse/touch pointer, e.g. iPhone emulation, independent of the OS motion setting)
- [x] Interaction sound effects fire on the right triggers, sound reasonable — verified locally (Playwright, via a QA-only trigger counter in `audioEngine.ts`: hovering into a CTA button's field fires the field-enter tone, approaching lock-on additionally fires the lock-on tone, clicking fires the click tone; the three are deliberately different synthesized timbres — sine blip / sawtooth downward zap / square confirm-click — actual audio quality is subjective and worth the owner's own ears, see summary)
- [x] Ambient audio fades in on first interaction (not blocked/broken by autoplay policy) — verified locally (Playwright: `AudioContext` is not constructed at all before the first click/keydown — confirmed via debug snapshot, and no "AudioContext was not allowed to start" warning ever appears in the console — then is created and running immediately after, with the ambient pad started and its gain ramping in)
- [x] Mute/unmute control is visible and works, and persists the visitor's choice — verified locally (Playwright: the control is visible in both normal and reduced-motion contexts, clicking it flips `aria-pressed` and the audio engine's actual gain/mute state together, and the choice survives a full page reload via `localStorage`)
- [ ] Sound + motion feel synced, not fighting each other — inherently subjective (tone character, timing feel, ambient pad mix); implemented and internally consistent (see summary) but genuinely worth the owner listening/watching hands-on rather than trusting an automated check here
- [x] No motion/audio memory leaks or runaway CPU on a long-idle page (leave a tab open, check) — verified locally (Playwright: instrumented `requestAnimationFrame`, nudged the field once, then measured zero rAF calls over a 2s idle window afterward — both the magnetic-field loop and the ambient-canvas loop stop scheduling frames once everything has settled, and only resume on the next pointer move)

## Phase 4 — Real Supabase wiring: admin editing, contact form, media library
None of this phase's actual Supabase round-trips could be exercised here —
there's no live Supabase project or valid Firebase session reachable from
this sandbox (see the task brief). What's checked below: `npx astro check`
+ `npm run build` both clean; every `/api/admin/*` route rejects an
unauthenticated request (401, or 403 from Astro's own origin check on a
same-origin-less POST/PATCH/DELETE — same behavior already established for
`/api/session` in Phase 0) instead of leaking a stack trace or 500ing;
every `getSupabase()` failure path (no `.env.local` here) is caught and
returns a clean JSON error + status rather than crashing the request; and
the pure validation/parsing logic (`normalizePagePath`, `isValidPageBlocks`,
`sniffImageDimensions`) unit-tested standalone via `tsx`.
- [ ] Admin can list pages, create a page, rename/change its path, delete a page — endpoint auth-gating (401/403 unauthenticated) and input validation (`normalizePagePath`/`normalizePageTitle`, unit-tested standalone via `tsx`) verified locally; the real Supabase round-trip (insert/update/delete actually landing, `23505` unique-path conflict returning 409) needs a real deployment + signed-in session
- [ ] Page editor: editing draft_blocks in CanvasEditor autosaves (debounced ~900ms) to the page's row — `useAutosave` hook unit-reasoned (skips save-on-mount, debounces, `flush()` bypasses the timer) and the PATCH endpoint verified for auth/validation; the actual save round-trip needs a real Supabase project + signed-in session
- [ ] Publish action copies draft_blocks → published_blocks, sets status/published_at, and the public site immediately reflects it — endpoint logic reviewed (fetch-then-write, both server-side); needs a real deployment to see it live
- [ ] Public catch-all route (`src/pages/[...path].astro`) and the homepage (`src/pages/index.astro`, since a static route always wins over the catch-all for "/") render `published_blocks` for a matching page and 404 otherwise — verified locally that both paths 404 cleanly with no Supabase configured (i.e. "no matching page" and "backend unreachable" fail the same safe way); rendering real published content needs a real project
- [ ] Admin's "Preview as visitor" renders draft_blocks (not published_blocks) through the same PublicPage component the public site uses — code shares PublicPage between PageEditor.tsx's preview mode and the catch-all route by construction (same component, different data source), same pattern already verified for CanvasDemo.tsx in Phase 2; needs a real page with draft ≠ published content to eyeball
- [x] Contact form validation (required fields, email format, length caps) works, server-side — verified locally against the running dev server: empty fields → 400, malformed email → 400, malformed JSON body → 400, oversized fields would 400 (length caps in code, not independently re-tested past the email/required cases above)
- [ ] Contact form submits successfully; submission lands in the inbox — client-side round trip (`ContactFormBlockView` → `/api/contact` → `contact_submissions` → `/admin/inbox`) reviewed end-to-end in code; verified locally that a well-formed submission reaches the "no Supabase configured" 500 cleanly (proves the endpoint doesn't crash) but the actual insert-and-appear-in-inbox needs a real Supabase project
- [ ] Admin inbox lists submissions newest-first and marking one read/unread persists — `InboxManager.tsx`'s optimistic-update-with-revert reviewed in code; needs a real project to confirm the round trip
- [ ] Media library: upload an image, browse existing images, reuse one on a new Image/Image+Text block via "Choose from library" — upload endpoint's validation (content-type allowlist, size cap, PNG/JPEG dimension sniffing) unit-tested standalone; the actual upload-to-Storage-bucket + picker browse/select flow needs a real Supabase project (Storage bucket from `supabase/migrations/0002_media_storage.sql`) — the picker UI's browse/select interaction itself (not the upload) could in principle be exercised against mocked data the way Phase 2's canvas demo was, but wasn't built out separately here since it's a thin wrapper over the same `MediaLibrary` component used everywhere else
- [ ] Media library: delete an unused image — endpoint reviewed (removes the storage object, then the row; if either the row-fetch or storage delete fails it's surfaced as an error rather than silently succeeding); needs a real project
- [x] Nested containers (columns/carousel) fully editable end-to-end, including on mobile — unchanged from Phase 2's verified behavior (CanvasEditor.tsx's core drag/resize/nesting logic wasn't touched this phase, only its data source); the new Contact Form block type slots into that same registry-driven machinery with no special-casing (confirmed by reading ColumnsBlockView/CarouselBlockView/BlockRenderer.tsx, which are all generic over BLOCK_REGISTRY) — not re-verified by hand in a browser, since no browser-automation tool was available in this environment (Phase 2's own Playwright passes predate this session)

## Phase 5 — Revision history + undo/redo + rollback + diagnostics
Same sandbox limitation as Phase 4 — no real Supabase project or Firebase
session reachable here, so nothing that needs an actual published `pages`
row or an actual signed-in browser session could be walked end-to-end.
What's genuinely different this phase: two of the three history layers
(session undo/redo, and the diff logic underlying the third) don't touch
Supabase at all, and the diagnostics checks were driven against a real
`@supabase/supabase-js` client pointed at a small local fake HTTP server
standing in for Supabase's REST/Storage APIs — not a mock of this repo's
own code, the actual library making real requests — so those got a much
more thorough live check than "code reviewed." `npx astro check` and
`npm run build` both clean throughout. All new `/api/admin/*` endpoints
(`[id]/history`, `[id]/rollback`, plus the now-extended `[id]` PATCH and
`[id]/publish`) verified 401 unauthenticated same as every existing
endpoint; `/admin/diagnostics` and `/admin/pages/[id]/history` verified
302-redirect-to-login unauthenticated.
- [x] Session undo/redo works across multiple edits, including redo after undo — verified two ways: (1) `src/lib/history/historyReducer.ts`, the pure state-transition core `useUndoRedo.ts` wraps, unit-tested standalone via `tsx` (bounded-stack capping, coalescing a drag/typing "gesture" into one undo step, undo→redo round-trips, a new edit after an undo correctly discarding the abandoned redo branch, undo/redo being safe no-ops at either end of the stack); (2) a temporary Playwright harness driving the real `PageEditor.tsx` (add a block via the toolbar, Undo via the button, Redo via the button, then the same two steps again via the Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z keyboard shortcuts, confirming the on-canvas block count matches at every step) — including confirming Ctrl/Cmd+Z while focused inside a block's contentEditable field does NOT trigger canvas undo (native text-editing undo should own that keystroke instead). Harness deleted after verifying, not committed.
- [x] Field-level diff view shows an accurate before/after for a real edit — `src/lib/history/diff.ts` unit-tested standalone via `tsx` against hand-built before/after `PageSection[]` snapshots: added/removed/changed blocks and sections (matched by id, not array index, so a pure reorder reports no changes), per-field before→after values, position.x/y/w/h changes reported individually, and the data-integrity cases called out in the phase brief specifically (`undefined`/`null`/missing-key all treated as the same "not set" value for comparison so none of those three produce a phantom diff entry against each other, while a real value→unset transition still IS reported and renders as "(not set)" rather than crashing or printing the literal string "undefined"). Also eyeballed via a temporary Playwright screenshot of `DiffView.tsx` (light + dark) against a snapshot pair exercising every diff kind at once — legible in both themes; harness deleted after verifying.
- [ ] Roll back a page to a previous published version successfully — `/api/admin/pages/[id]/rollback.ts` reviewed in code (only accepts an `event_type='publish'` revision belonging to the target page, writes `published_blocks`/`status`/`published_at`, never touches `draft_blocks`, and logs the rollback itself as a NEW `publish` revision rather than rewriting history); needs a real Supabase project + published history to exercise the actual round trip.
- [ ] Full publish history list is accurate and in the right order — `/api/admin/pages/[id]/history.ts` reviewed (orders `created_at desc`, scoped to `owner_type='page'` + the page's id); `HistoryPanel.tsx`'s per-entry diff (diffing each revision against the very next-older one in the newest-first list, or against an empty page for the oldest entry on record) reviewed in code and exercises the same `diffPageBlocks` verified above; needs real accumulated history (several draft saves + publishes on a real page) to confirm the end-to-end ordering/rendering.
- [x] Diagnostics screen accurately reflects real backend/auth connectivity state — `src/lib/diagnostics.ts`'s `runDiagnostics()` accepts an optional injected Supabase client purely for testability (real callers always omit it and get the normal service-role client); driven end-to-end against a real `@supabase/supabase-js` client pointed at a local fake server, confirming a fully-healthy project reports every check green with real row counts and bucket status surfaced in each check's detail text. Harness deleted after verifying.
- [x] Diagnostics screen correctly flags a broken state (test by temporarily breaking something) — same harness, three distinct broken states: (1) a project that ran `0001_init.sql` but not `0002_media_storage.sql` (tables exist, `media` bucket doesn't) — the media-bucket check FAILS with a bucket-specific reason while general connectivity and every table-row-count check still PASS, exactly the "distinct failure" the phase brief asks for; (2) Supabase totally unreachable (nothing listening) — connectivity and bucket checks both FAIL, with a real connection-error message, NOT the "does not exist" wording from case (1) — confirmed those two failure modes read differently rather than collapsing into one generic "broken" state; (3) env vars genuinely unset (`getSupabase()` itself throws) — the config check fails and every downstream check reports "Skipped — Supabase is not configured" rather than crashing the page. What's NOT verified here: the actual `/admin/diagnostics` Astro page rendering these in a real signed-in browser session (needs a real Firebase session + Supabase project) — only the underlying `runDiagnostics()` logic the page calls directly, unchanged, to build its rows.

## Phase 6 — Content rebuild + cutover
- [ ] Every page from the old site has been recreated and reviewed
- [ ] All internal links between pages work (no dead links)
- [ ] DNS cutover verified: portfolio.bridgerjones.com serves the new site
- [ ] Old app fully retired (routes, hosting, unused env vars/secrets cleaned up)
- [ ] 404 page works
- [ ] Favicon / meta tags / page titles correct across all pages

## Cross-cutting (check again at the very end, regardless of when it was first verified)
- [ ] Full keyboard navigation through the public site
- [ ] Screen reader sanity pass on the public site (headings, alt text, form labels)
- [ ] Every page tested at narrow (mobile), medium (tablet), and wide (desktop) widths
- [ ] Every page tested in both light and dark mode
- [ ] No console errors/warnings anywhere in the public site or editor
- [ ] Lighthouse/perf check — confirm the bundle-size fix actually landed
- [ ] Sign-out / re-sign-in flow works cleanly
- [ ] Refresh mid-edit doesn't lose unsaved work unexpectedly (or clearly warns)
