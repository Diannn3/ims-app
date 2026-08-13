# IMS UI System

## Design goal

The IMS Academic Hub should feel like a deliberate academic product, not a generic database dashboard. UI polish must not weaken accessibility or native browser behavior.

## Brand source

The supplied IMS mark establishes the primary identity. Dominant sampled colors used by the design tokens:

- IMS blue: `#009BFF`
- IMS green: `#17960E`
- IMS yellow: `#FAF807`
- White geometry

Because the raw blue/yellow are not always appropriate for small text on white, the interface also uses darker accessible derivatives:

- deep blue: `#0077B8`
- blue ink: `#005F91`
- deep green: `#116B0A`

The original logo remains intact; derivatives are UI colors, not logo recoloring.

## Product aesthetic

- cool white / blue-tinted surfaces rather than gray enterprise dashboards
- high-information-density screens retain generous hierarchy and whitespace
- blue handles navigation/primary action, green communicates verified/success, yellow is used sparingly for attention/review states
- subtle shadows and thin cool borders; avoid oversized glassmorphism and decorative glow clutter
- typography prioritizes legibility and information hierarchy

## Typography

System-first stack with modern platform fonts to avoid font-download dependency. Use `text-wrap: balance` for headings and `text-wrap: pretty` for body copy when supported. Long official names/URLs must wrap safely.

## Interaction requirements

- 44×44 CSS-pixel minimum primary touch targets
- visible `:focus-visible`
- skip link and stable `<main id="main-content">`
- do not disable browser pinch/page zoom
- keyboard-operable links/buttons/map room controls
- native links for navigational actions to preserve Ctrl/Cmd-click and browser history
- URL query parameters for shareable filters/search where appropriate
- reduced-motion-safe animation
- meaningful loading/error/empty states; never skeleton fake institutional data on first SSR render

## Responsive strategy

Mobile-first. Use grid/flex/container-aware layout rather than copying desktop cards into a single column. Fixed bottom navigation is safe-area-aware. Wide admin tables may scroll inside a bounded container while preserving row identity and severity.

## Motion

Motion is functional: map fit/route transitions, subtle hover/focus affordances, state changes. `prefers-reduced-motion` disables nonessential smooth behavior/animation.

## Native platform preference

Prefer semantic HTML and modern native platform primitives where they genuinely reduce JavaScript. Progressive enhancement is preferred over replacing reliable browser behavior. Do not add UI libraries solely for basic dialogs, popovers, forms, or navigation unless a real product need justifies them.
