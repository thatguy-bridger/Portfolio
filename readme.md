# Portfolio Builder Design System

> **Use this as a flexible starting point, not a rulebook.** The tokens, components, and guidelines below capture the current visual direction — they're meant to speed you up, not box you in. Deviate whenever a specific screen, feature, or user request calls for it: swap an accent color, loosen a radius, skip the glass effect, invent a new component variant. When something here conflicts with what's actually being asked for, follow the ask. Treat this file as "here's the vibe and the reusable pieces," not "here are the rules."

Design system for **Portfolio Builder** — a product that lets people spin up a personal portfolio site (public page, drag-and-drop builder, templates, custom domain/settings) without writing code.

## Source material

This system's visual language is lifted from the user's own personal project, **School-Homepage** (`thatguy-bridger/School-Homepage`, branch `main`) — a vanilla-JS/Tailwind school dashboard the user built and customized by hand (glassmorphism cards, multi-accent color system, pill buttons, hover-lift, Inter type). The brief was to take that hand-built visual identity and turn it into something "super beautiful" for a real product: **Portfolio Builder**. None of the school-specific content (classes, bell schedule, calendar) carried over — only the visual DNA: color system, type, radii, shadows, glass, and motion language.

Explore the source further at https://github.com/thatguy-bridger/School-Homepage — particularly `Archived Versions/v2/index.html`, the most fully developed version, for the original glassmorphism dashboard this system's motion and surface language is drawn from.

No logo was provided for "Portfolio Builder" itself (the repo's logo is a school-schedule clipboard mark, unrelated to this product) — brand identity here is a styled wordmark. See **Brand** below.

## Content fundamentals

*(Same spirit applies here: these are observed patterns from the source, not hard requirements — write what fits the moment.)*

- **Voice**: direct, first-person-plural product copy ("Publish your site," "Choose a template") — task-oriented, no marketing fluff. Source app copy is plain and functional ("Pick A Class," "Edit Class Settings," "Add New Category") — labels tell you exactly what a button does.
- **Casing**: Title Case for headings and buttons ("Edit Class Settings," "Add New Category"); sentence case for helper text and descriptions.
- **Tone**: friendly-efficient, zero jargon. Confirmations are plain ("Confirm Action") rather than cute.
- **Emoji**: not used in the UI itself. The source README uses emoji as section markers (📚 📅 🎨) — a markdown/docs convention, not a product-UI one. Keep emoji out of the actual interface.
- **Pronouns**: second-person for the end user ("your site," "your settings"); the product speaks directly to the person building their portfolio.

## Visual foundations

*(Defaults, not constraints — reach for a different radius, color, or motion choice whenever the specific design calls for it.)*

- **Color**: a deliberate multi-accent system rather than one brand color — indigo (primary actions), purple (secondary/time-related), orange (highlights/titles), pink/red (alerts, destructive), green (success/confirm), cyan/blue (informational). Each accent has a lighter value for dark mode and a deeper value for light mode. See `guidelines/colors-*.card.html`.
- **Type**: Inter throughout, weights 300–800. Display headings are extrabold (800) with tight (-0.02em) tracking; body copy is regular/medium with relaxed leading. No serif, no mono display face.
- **Backgrounds**: dark mode is near-black (`#0a0a0a`) with glass panels floating above soft radial color blooms (indigo/purple). Light mode is a neutral warm gray. No photography, no illustration, no repeating texture/pattern — the "imagery" is color and blur, not pictures.
- **Glassmorphism**: translucent panels (`rgba` surfaces) with `backdrop-filter: blur(20px)`, hairline borders (`rgba(255,255,255,.12)` or theme border token), and a soft shadow. Used broadly — cards, modals, the builder canvas.
- **Animation**: consistently eased, never linear. Standard easing `cubic-bezier(0.4,0,0.2,1)` for color/opacity/shadow transitions (0.2–0.5s); a bouncier `cubic-bezier(0.34,1.56,0.64,1)` for drag-and-drop reordering. No spring physics, no parallax.
- **Hover states**: cards lift `translateY(-8px)` and gain a larger, softer shadow; buttons/icon-buttons scale to `1.05–1.1` and pick up a colored glow shadow matching their accent. Hidden affordances (e.g. "open in new tab") fade in on card hover.
- **Press states**: no explicit press/active treatment in the source beyond the browser default — hover scale effectively doubles as the primary feedback state.
- **Borders**: 1px hairline, theme-aware (`border-gray-200` light / `border-gray-700` dark), used on almost every card, input, and modal — never a colored accent border.
- **Shadows**: soft and dark-tinted (never colored except the deliberate accent "glow" shadows on hover), growing from `sm` to `xl` with elevation. No inner shadows.
- **Corner radii**: generous and consistent — `xl`/`2xl` (16–32px) for containers and cards, full pill (`9999px`) for every button and toggle. Nothing sharp-cornered.
- **Transparency & blur**: used specifically for elevated/floating surfaces (modals, cards over ambient backgrounds) — never for flat background fills.
- **Layout**: centered, max-width content column (source uses a single `max-w-7xl` container); responsive grid categories that collapse from 3-up to 1-up. No fixed/sticky chrome beyond corner-anchored icon buttons.
- **Imagery color vibe**: n/a — this system uses no photography; where a UI kit needs project thumbnails, solid accent-color blocks stand in (see Iconography/Assets note below).

## Iconography

The source app hand-draws its icons as inline SVG paths (Heroicons-style outline icons — settings gear, sun/moon/system theme icons, drag handle, close/X, external-link). No icon font, no icon sprite sheet, and no SVG icon files were committed to the repo to copy forward.

For this design system, icon usage in components/UI kit mockups is done with plain Unicode glyphs (⚙ ☾ ✕ ⠿) standing in for that same outline-icon role — **flagged substitution**: for production use, swap these for a proper stroke-icon set. **Recommended match**: [Lucide](https://lucide.dev) (CDN: `https://unpkg.com/lucide-static/font/lucide.css` or the React package) — same 24px outline/stroke-2 style as the source's hand-drawn Heroicons-style SVGs.

No emoji are used as icons anywhere in the product UI.

## Brand

No logo file exists for "Portfolio Builder." Per design-system policy, no logo was invented — `guidelines/brand-wordmark.card.html` shows the styled wordmark used everywhere a mark would normally go. If a real mark exists or gets designed, drop the SVG into `assets/` and update this card.

## Fonts

Inter is loaded from Google Fonts (`tokens/typography.css`) at weights 300–800, matching the source app's exact usage — no substitution needed. No mono/code typeface is defined yet; if one's ever needed, add a `--font-mono` token plus its `@font-face` (or a Google Fonts mono face) at that point.

## Index

- `styles.css` — root stylesheet, imports everything below.
- `tokens/colors.css` — base palette + semantic aliases, dark (default) and `[data-theme="light"]` scope.
- `tokens/typography.css` — Inter font-face import + type scale.
- `tokens/spacing.css` — spacing and radius scale.
- `tokens/effects.css` — shadows, blur, easing/duration, base reset.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Shape, Motion, Brand).
- `components/core/` — Button, IconButton, Badge.
- `components/forms/` — Input, Select, Switch.
- `components/feedback/` — Modal.
- `components/surfaces/` — GlassCard.
- `components/navigation/` — Tabs.
- `ui_kits/portfolio-builder/` — click-through recreation: public portfolio page, builder dashboard, template gallery, settings.
- `SKILL.md` — portable skill file for using this system elsewhere (e.g. Claude Code).

### Intentional additions

No component library existed in the source to enumerate — the source app is a single hand-written HTML/CSS/JS file, not a componentized codebase. The component set above (Button, IconButton, Badge, Input, Select, Switch, Modal, GlassCard, Tabs) was authored from scratch, sized to what a portfolio-builder product needs, using only the visual patterns actually observed in the source (pill buttons, circular icon buttons, glass cards, modals, segmented theme switch).
