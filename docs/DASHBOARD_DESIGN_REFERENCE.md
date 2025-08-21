# DaorsForge Dashboard Redesign Reference

## Visual Style Principles

- **Color Palette:**
  - Dominant: Deep black (#101014), charcoal (#18181b), and dark gray (#23232a)
  - Accent: Electric blue (#3b82f6), teal (#06b6d4), and soft purple (#a78bfa)
  - Surfaces: Use true black or near-black for main backgrounds, with subtle gradients for depth
  - Text: White (#fff), light gray (#e5e7eb), and muted gray (#a1a1aa)
  - Alerts: Use saturated yellow, green, and red for status, but keep backgrounds dark

- **Layering & Porosity:**
  - Use glassmorphism: semi-transparent cards (bg-black/60, bg-zinc-900/70, or bg-gradient-to-br from-black/70 to-zinc-900/80)
  - Backdrop blur (backdrop-blur-md or xl) on all floating panels and cards
  - Borders: 1px solid with low opacity (border-white/10 or border-zinc-100/10)
  - Shadows: Soft, wide, and subtle (shadow-xl, shadow-black/40)

- **Blednanje (Blending):**
  - All overlays and modals should blend with the background using transparency and blur
  - Avoid harsh white cards; use dark glassy surfaces
  - Gradients for hero/headers: from-black/90 to-transparent, or blue/teal overlays

- **Poroznost (Porosity):**
  - Cards and widgets should feel "light"—use padding, rounded corners (rounded-2xl), and spacing
  - Allow background to subtly show through via opacity and blur
  - Avoid dense, blocky layouts—prefer grid gaps and whitespace

## Component Guidelines

- **Sidebar:**
  - Solid black or dark gradient, with accent highlights on active items
  - Icons: white or accent color, with hover/focus glow

- **Navbar (if used):**
  - Transparent or glassy, never solid white
  - Only for search, notifications, and profile

- **Cards/Widgets:**
  - bg-black/60 or bg-gradient-to-br from-zinc-900/80 to-black/70
  - border border-white/10, shadow-xl
  - backdrop-blur-md
  - Text: white, with accent for numbers or highlights

- **Buttons:**
  - Primary: blue or teal gradient, white text
  - Secondary: glassy dark, white text, border
  - Hover: increase brightness, add subtle shadow

- **Charts:**
  - Use dark backgrounds, accent lines/bars
  - Grid lines: low opacity white

- **Alerts/Badges:**
  - Glassy backgrounds, colored border or icon
  - Text always white or light

## Example Tailwind Classes

- `bg-black/70`, `bg-zinc-900/80`, `backdrop-blur-xl`, `border border-white/10`, `shadow-xl shadow-black/40`, `rounded-2xl`, `text-white`, `text-zinc-300`, `hover:bg-blue-600/80`, `focus:ring-2 focus:ring-blue-400`

## General Layout

- Metrics and charts always above the fold
- Use grid layouts with generous gap-8 or gap-10
- Avoid scrollbars on main dashboard unless necessary
- Footer hidden on dashboard

## Accessibility

- Ensure all text has sufficient contrast on dark backgrounds
- Focus states: visible ring or glow
- All icons have aria-labels

---

> Use this file as a reference for all future UI/UX work. All new components and pages should match this dark, glassy, and modern style for a unified experience.
