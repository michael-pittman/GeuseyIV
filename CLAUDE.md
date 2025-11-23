# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neo-Sprite Chat 3D (GeuseyIV) - A React 19 + Three.js application featuring an interactive 3D particle system background with a glassmorphic chat interface that integrates with n8n webhooks.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

No test or lint commands are currently configured.

## Architecture

### Context-Based State Management

Two React contexts defined in `types.ts` manage global state:
- **ThemeContext**: Light/dark theme with `theme` enum and `toggleTheme()`. Theme preference detected from system on mount.
- **LayoutContext**: Chat visibility via `isChatOpen` boolean and `setChatOpen()`. Controls camera zoom animation when chat opens.

### Component Structure

- **App.tsx**: Root component providing ThemeContext and LayoutContext providers. Handles initial theme detection and DOM class toggling for Tailwind dark mode.
- **Scene.tsx**: Three.js CSS3DRenderer (not WebGL) managing 512 HTML DOM elements (120px sprites) as CSS3DSprites. Features six geometry transformations (Plane, Cube, Sphere, Spiral, Fibonacci, Random) with TWEEN.js animations cycling every 16 seconds.
- **ChatWidget.tsx**: Chat modal with n8n webhook integration. Includes session ID tracking for conversation continuity. Flexible response parsing handles multiple field names (`output`, `text`, `message`, `response`).
- **ThemeToggle.tsx**: Neumorphic toggle button for theme switching.

### Animation System (Scene.tsx)

**TWEEN Groups**: Two separate TWEEN groups prevent animation conflicts:
- Default `TWEEN` group: Particle position/rotation transitions (cleared on each geometry change)
- `cameraTweenGroup`: Camera zoom animations (persists independently)

**Breathing Animation**: Radial wave pattern based on particle distance from center:
- Phase = `distance * 0.002` creates expanding/contracting rings
- Single frequency: `sin(time * 1.2 - phase) * 0.25`
- Lerp factor 0.15 for smooth interpolation

**Camera Zoom**: Opens chat triggers zoom from z=2500 to z=4500 over 2000ms with `Cubic.Out` easing.

**Particle Transitions**: Distance-based stagger (max 600ms delay) creates radial wave effect when changing geometries.

### Key Integration Points

The Scene component coordinates with chat state through LayoutContext. Camera position starts at (0, 200, 2500) with slight upward offset.

### Webhook Configuration

Chat messages POST to n8n webhook URL configured via `VITE_WEBHOOK_URL` environment variable (fallback hardcoded in ChatWidget.tsx). Each session gets a unique ID for conversation tracking.

## Build Configuration

- **TypeScript**: ES2022 target with `@/*` path alias mapping to project root
- **Vite**: Port 3000, React plugin with Fast Refresh
- **Tailwind**: Custom neumorphic/neobrutalist shadows (`neu-flat`, `neu-pressed`, `brutal`), custom colors in `neo` namespace
- **Deployment Target**: AWS S3 static hosting
