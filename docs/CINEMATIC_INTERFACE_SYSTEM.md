# Cinematic Interface System

Internal interaction and composition rules for premium Prometheus surfaces. This document exists to stop accidental UI drift into clipped, bloated, glow-heavy, or structurally ambiguous layouts.

## Source Signals

This system is derived from:

- Apple Human Interface Guidelines on motion, materials, windows, ornaments, and spatial layout
- Apple visionOS guidance around dynamic scale, depth, and uncluttered auxiliary controls
- `ehmo/platform-design-skills`, especially the macOS sections for windows, pointer behavior, visual design, and accessibility
- Product interaction references such as Apple Music, Linear, Raycast, Framer, Arc, and Nothing OS

The goal is not mimicry. The goal is native-feeling structure, believable motion, and compact luxury.

## A. Spatial Safety Rules

### Core principle

No primary object may visually clip unless it is intentionally masked as part of the composition.

### Chamber safe zones

- Every chamber panel must reserve an inner safety gutter of `24px` on desktop and `18px` on compact widths.
- Hero objects must sit inside a dedicated safe-stage container, not directly against the panel edge.
- Rotating or scaling objects must maintain at least `20px` of breathing room from the nearest panel edge after transform, shadow, and focus glow are included.
- Scroll masks are allowed to hide list content at edges; they are not allowed to cut interactive focal objects.

### Animation boundaries

- Hover scale on primary objects: `1.01` to `1.03` max.
- Press scale on tactile controls: `0.96` to `0.985`.
- Free-floating decorative offsets may not exceed `12px` unless attached to a masked ambient layer.
- Do not use negative positioning on functional components unless the component is inside a container with an intentional reveal mask.

### Responsive bounds

- Hero artwork diameter must clamp to a safe range and never exceed `46%` of the chamber width or `252px`, whichever is smaller.
- Song-row action controls reserve fixed inline space of `40px` to `44px` and never participate in text wrapping.
- Compact breakpoints must reduce object scale before collapsing hierarchy.
- If a row risks wrapping, reduce spacing and text width first; do not allow action controls to drop to a second line.

### Layout containment

- Every flex row with a trailing action must use `min-w-0` on the content group and `shrink-0` on the action group.
- Ornament-like side rails must define explicit min and max widths.
- Use overflow clipping only on material shells and masked scroll regions, never as a band-aid for unsafe placement.

## B. Hierarchy Rules

### Core principle

Premium density means less noise, not more emptiness.

### Weight distribution

- One hero focal point per chamber.
- One supporting control cluster.
- One secondary information rail.
- If two elements compete visually, the non-essential one must lose contrast, scale, or motion.

### Compact luxury spacing

- Preferred rhythm: `8 / 12 / 16 / 24 / 32`.
- Card rows should usually live between `68px` and `84px` tall.
- Avoid vertical stacks of helper copy under every heading.
- Compress metadata into a single line whenever it remains legible.

### Information compression

- Titles carry the most weight.
- Artists, subtitle, BPM, and state should be visible but visually subordinate.
- Decorative explanation copy is removed unless it changes a decision.
- Selected state should feel stronger through edge quality and continuity, not size inflation.

## C. Motion Philosophy

### Core principle

Motion must explain structure, mass, and response.

### Motion layers

- Structural transitions: panel shifts, content swaps, list insertions
- Interactive transitions: hover, press, focus, selection
- Ambient transitions: slow art rotation, subtle material drift, inertial carry

Each layer must be readable on its own. Ambient motion may never overpower interactive feedback.

### Easing families

- Structural ease: `cubic-bezier(0.22, 1, 0.36, 1)`
- Hover ease: `cubic-bezier(0.16, 1, 0.3, 1)`
- Press return: spring with fast settle
- Inertia: velocity carry with soft damping and restrained overshoot

### Spring ranges

- Hover springs: stiffness `220-320`, damping `20-28`, mass `0.55-0.8`
- Selection/focus springs: stiffness `240-360`, damping `24-30`, mass `0.7-0.95`
- Parallax springs: stiffness `160-240`, damping `18-24`, mass `0.45-0.7`

### Timing

- Hover response: `140-220ms`
- Press response: `90-140ms`
- Content swap reveal: `220-320ms`
- Decorative ambient loops: `18-24s` minimum

### Inertia philosophy

- Scroll carry should imply weight, not bounce theatrics.
- Deceleration must be smooth and quiet.
- Edge settling can overshoot slightly, but only enough to acknowledge physical bounds.
- Never use fake smooth-scroll CSS as a substitute for momentum.

## D. Microinteraction Rules

### Hover

- Hover should feel magnetic: slight lift, tiny parallax, clearer edge lighting.
- Hover must preserve layout; no hover should trigger row reflow.
- Cursor-adjacent motion should be within `1-4px`.

### Press and release

- Press compresses depth slightly and reduces glare.
- Release returns with a short spring, not a snap.
- Buttons should feel denser under press, not mushy.

### Selection and focus

- Selection uses continuity: persistent edge tone, stronger depth, and icon state transition.
- Focus uses crisp contrast and glow restraint.
- Focus and selection must be distinguishable.

### Scrolling and drag

- Scroll surfaces must keep the user oriented with masked edges and stable alignment.
- Drag momentum should feel connected to the finger or pointer velocity.
- Click suppression is acceptable after a deliberate drag threshold has been crossed.

### Liquid morphing

- Use shape refinement, reflection shift, and subtle scale, not blob growth.
- Border radius may animate slightly if it improves tactility.
- Internal highlights should move less than the component body.

## E. Glass and Material Rules

### Core principle

Material establishes hierarchy. It is not decoration.

### Usage

- Use stronger glass only for controls, rails, and selected states.
- Use quieter standard materials for content shells.
- Blur is appropriate when it separates layers or preserves context beneath controls.
- Avoid stacking more than two translucent layers in the same local region.

### Edge lighting

- Use one hairline highlight and one shadow family per component.
- Edge light should imply curvature and separation, not neon.
- Selected accents can shift toward cyan or cool white, but should remain narrow and precise.

### Contrast

- Text legibility wins over translucency purity.
- Blur without contrast support is not premium; it is muddy.
- If a glass surface needs multiple glows to read, the surface is designed incorrectly.

### Prohibitions

- No random radial blobs to fake luxury.
- No oversized glow fields around ordinary cards.
- No full-panel blur haze that weakens content boundaries.

## F. Composition Rules

### Core principle

Compose the chamber like a frame, not a dashboard.

### Asymmetry

- Prefer a hero-to-rail composition over evenly weighted columns.
- Keep one side calmer so the focal side can breathe.
- Auxiliary controls should behave like ornaments attached to the primary composition, not equal-weight tiles.

### Negative space

- Negative space must direct attention, not merely fill the canvas.
- Empty regions should be intentional buffers between focal groups.
- If a space cannot explain what it is protecting, tighten it.

### Directional flow

- Eye path should move from focal artwork to title/state to selectable rail.
- Search belongs in the rail header, not the hero stage.
- Repeated rows should establish cadence through alignment and consistent row height.

### Focal preservation

- The artwork stage must stay fully visible at every supported breakpoint.
- Control rails must never visually overpower the hero stage.
- Selected rows may gain definition, but not enough area to become the new focal anchor.

## Implementation Checklist

Use this before shipping:

- No clipping of hero art, focus rings, or hover transforms
- No wrapped trailing actions in song rows
- Safe min/max widths on search, rail, and hero stage
- Selected state stronger through edge treatment, not bigger boxes
- Scroll region hides scrollbar, preserves momentum, and fades cleanly at edges
- Reduce Motion path keeps structure intact without decorative movement
- Reduce Transparency fallback remains readable
