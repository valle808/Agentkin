# AgentKin Portal – Walkthrough

## Overview
This document details the transformation of the AgentKin portal into a futuristic, high-performance workspace for decentralized AI agents.

## 🎨 Theme & Aesthetics
- **Core Theme**: "Clean, Clear, and Intense Orange".
- **Palette**:
  - **Background**: Pure White (`#FFFFFF`) / Light Grey Surface (`#F5F5F7`).
  - **Text**: Deep Black (`#111111`) / Dark Grey (`#666666`).
  - **Accent**: International Orange (`#FF4D00`).
- **Design System**: 12-column Bento Grid with soft shadows and sharp borders.

## ✨ Animations & Physics
The site features advanced, mouse-reactive physics to create a living digital environment.

### 1. Hero Text Physics
- **Title ("Build the Future")**: Letters are individual physical entities that scatter when the mouse approaches and snap back.
- **Subtext ("Decentralized AI...")**: Materializes from the void with a **Spectral Fade** (blur + rotation), then becomes physically interactive after stabilizes.
- **Underline**: The orange line under "Future" **draws itself** on load and acts as a rigid body that bends away from the cursor.

### 2. CTA Button
- **Shape**: Friendly Pill (`border-radius: 50px`).
- **Interaction**:
  - **Idle**: Subtle "breathing" pulse.
  - **Hover**: A beam of light (sheen) slides across the surface.
  - **Physics**: Smooth magnetic attraction to the cursor.

### 3. Backgrounds
- **Home (`index.html`)**: **Monochrome Architect**. A clean 3D particle system in charcoal/grey. Interaction triggers **Intense Orange** connections and glow.
- **Terms (`terms.html`)**: **Alien Dimension**. A dark, holographic neural grid with iridescent colors (Cyan/Magenta/Lime) and a warping "Black Hole" mouse effect.

## 🔗 Backend Integration
- **Live Data**: The "Live Tasks" card fetches real data from `http://localhost:8000/tasks`.
- **Display**: Shows Task Title and ID.
- **Status Mapping**:
  - `RUNNING` -> Active (Green glow).
  - `COMPLETED` -> Done (Green text).
  - `OPEN` -> Default (Grey).
- **Fallback**: Gracefully degrades to demo data if the API is unreachable.

## 📱 PWA Support
- **Manifest**: `manifest.json` configured for standalone install.
- **Service Worker**: `service-worker.js` caches core assets.
- **Install Prompt**: **Persistent "Install App" button** in the header (works on all pages).
   - Triggers native prompt if available.
   - Shows instructions if browser blocks prompt (e.g. iOS).

## 🚀 Deployment
One-click launch is now available via PowerShell:
```powershell
.\start_agentkin.ps1
```
This script:
1.  Terminates any stale backend processes.
2.  Launches the **FastAPI Neural Core** on `localhost:8000`.
3.  Opens the **AgentKin Dashboard** in your default browser.

## Files
- `index.html`: Main portal (Light Theme).
- `terms.html`: Terms of Service (Dark Alien Theme).
- `antigravity-background.js`: Home background logic.
- `alien-background.js`: Terms background logic.
- `start_agentkin.ps1`: Unified launch script.

