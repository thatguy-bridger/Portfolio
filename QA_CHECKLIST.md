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
- [ ] Light / dark / auto theme all render correctly, no flash-of-wrong-theme
- [ ] Theme toggle persists across reload
- [ ] Font library loads and applies (display + body fonts)
- [ ] Accent color picker changes the live theme correctly
- [ ] ColorPicker: pick a color, clear a color (None), save a color to defaults, remove a saved swatch
- [ ] ColorPicker: setting RGBA to all zero does not break saving (regression check for the bug fixed pre-rewrite)
- [ ] Alta-style card/shadow/radius scale applied consistently across components
- [ ] No visual regressions vs. the pre-rewrite Portfolio design language

## Phase 2 — Block registry + core blocks + freeform canvas
- [x] Add every block type from the registry at least once; each renders correctly — verified locally (hero, rich-text, image, image-text, button, quote, divider, columns, carousel all present in the demo harness's seed content, plus each addable fresh via the "+ Add block" picker)
- [x] Inline click-to-edit works for text/image fields directly on canvas — verified locally (Playwright: edited a hero heading in place, confirmed the new text persisted)
- [x] Side panel opens for non-inline fields (links, URLs, settings) — verified locally (a button's Link field, a hero's Alignment/Heading size/Text color — none of these are click-to-edit on the canvas itself)
- [x] Freeform drag works; snapping/alignment guides appear and work — verified locally (dragging a block so its edge/center lines up with another block's edge/center shows a guide line and snaps within the threshold; verified both axes)
- [x] Resize handles (Canva/Slides-style) work on all sides + corners, maintain aspect ratio where expected — verified locally (all 8 handles present on selection; corner and side handles both resize correctly; holding Shift on a corner handle preserves aspect ratio within snap-rounding tolerance)
- [x] Nested containers: drag a block into a column/carousel slot and back out — verified locally (Playwright: dragged a top-level block onto a Columns slot, confirmed it replaced the slot's content and the top-level block count dropped by one; used the slot's "pull out" control to extract it back to a top-level block)
- [x] Mobile: pages reflow automatically without a separate mobile-position tab; nothing overlaps or overflows — verified locally (both the editor's mobile-preview toggle and the public renderer at a 380px viewport show every section's blocks stacked full-width in y-order; Columns/Image+Text blocks also switch to a stacked internal layout at that width so nothing is squeezed unreadably narrow)
- [x] Delete/duplicate/reorder a block — verified locally (Playwright: Duplicate increased the block count by one, Send to back changed its zIndex to below the others, Delete removed it)
- [ ] Draft vs. published states behave correctly per page (not site-wide) — out of scope this phase; the demo harness is local-state only and isn't wired to the real Supabase `pages` table yet (see the `// TODO(phase-4-or-later)` marker in CanvasDemo.tsx) — re-check once a later phase wires the editor to real draft/publish rows

## Phase 3 — Motion + Sound
- [ ] Magnetic cursor attraction works on intended elements
- [ ] Repulsion field behaves correctly near the pointer
- [ ] Elements-react-to-each-other effect looks right, no jitter/lag
- [ ] Motion layer is present on public site + preview, absent in the editor
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Interaction sound effects fire on the right triggers, sound reasonable
- [ ] Ambient audio fades in on first interaction (not blocked/broken by autoplay policy)
- [ ] Mute/unmute control is visible and works, and persists the visitor's choice
- [ ] Sound + motion feel synced, not fighting each other
- [ ] No motion/audio memory leaks or runaway CPU on a long-idle page (leave a tab open, check)

## Phase 4 — Contact form + media library + nested containers
- [ ] Contact form submits successfully; submission lands in the inbox
- [ ] Contact form validation (required fields, email format) works
- [ ] Media library: upload an image, browse existing images, reuse one on a new block
- [ ] Media library: delete an unused image
- [ ] Nested containers (columns/carousel) fully editable end-to-end, including on mobile

## Phase 5 — Revision history + undo/redo + rollback + diagnostics
- [ ] Session undo/redo works across multiple edits, including redo after undo
- [ ] Field-level diff view shows an accurate before/after for a real edit
- [ ] Roll back a page to a previous published version successfully
- [ ] Full publish history list is accurate and in the right order
- [ ] Diagnostics screen accurately reflects real backend/auth connectivity state
- [ ] Diagnostics screen correctly flags a broken state (test by temporarily breaking something)

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
