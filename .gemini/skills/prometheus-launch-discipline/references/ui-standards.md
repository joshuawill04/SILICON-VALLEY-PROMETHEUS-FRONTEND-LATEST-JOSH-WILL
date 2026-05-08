# Prometheus UI/UX Standards

The Prometheus visual language is inspired by premium, cinematic toolsets and Apple-like minimalism. It avoids generic SaaS "dashboard" energy in favor of a dark, immersive "chamber" feel.

## Visual Hierarchy & Spacing
- **Negative Space**: Use generous whitespace (negative space) to focus the eye on creative tools.
- **Grids**: Use a strict 4px/8px grid system.
- **Surface Elevation**: Use subtle borders (`border-white/8`) and background blurs (`backdrop-blur-md`) rather than heavy drop shadows.
- **Typography**:
  - **Headings**: Luxurious, high-contrast serif (e.g., *GrandCru*, *Bellavoir*) for brand moments.
  - **Interface**: Clean, highly readable sans-serif (e.g., *Inter* or *Geist*) for utility.
  - **Mono**: Subdued monospace for technical metadata and code blocks.

## Motion & Interaction
- **Cinematic Ease**: Use custom easing (e.g., `[0.22, 1, 0.36, 1]`) for all transitions. Avoid linear or generic ease-in-out.
- **Micro-interactions**: Hover states should be soft (subtle opacity or scale shifts). Use "Luxury Vignette" overlays to shift mood.
- **Animation Restraint**: Animations should clarify state changes (e.g., collapsing panels, loading media) but never delay the user's workflow.

## Color Palette
- **Primary**: Premium Blue (`#267dff`) used sparingly for critical actions and active states.
- **Background**: Deep "Ink" blacks (`#09090c`, `#0c0c10`).
- **Accent**: Lime/Mint (`#b1ff60`, `#9ff6e3`) for "ready" or "success" states.
- **Subtle White**: Use opacity scales (`white/4`, `white/8`, `white/24`, `white/48`) for hierarchy instead of solid grays.

## UI Anti-Patterns (The "No" List)
- No generic Tailwind "Indigo" or "Blue-500".
- No bright white backgrounds in the workspace.
- No bulky, standard Bootstrap-style buttons.
- No standard SaaS "sidebar + header + cards" templates.
- No standard tooltips that block the video surface.

## Product Logic
- **Project Recovery**: The UI must reflect persistence status ("Saved", "Saving", "Error").
- **Asset Visibility**: Never show an empty state without a clear path to "Add Source" or "Upload".
- **Error States**: Errors should be helpful and "within the chamber" (not standard browser alerts).
