# Creating a VR Simulation

Use this workflow to add new VR content without changing the behavior of existing simulations.

## 1. Define the learning experience

Before writing code, record:

- one measurable learning objective;
- the misconception the experience will confront;
- the grade band, subject, and expected duration (maximum 12 minutes);
- the interaction pattern, such as Try-Predict-Observe-Explain;
- the comfort risk (`low`, `medium`, or `high`);
- the instructor setup, headset activity, class companion activity, and debrief.

Use the checklist in `simulation-design-system.md` as the release gate.

## 2. Create the Three.js viewer

Copy the closest existing viewer in:

```text
apps/web/components/simulations/
```

Name the new client component `<SimulationName>Viewer.tsx`. Keep Three.js scene setup and cleanup inside the component. In particular:

- dispose geometries, materials, textures, controls, and animation frames on unmount;
- keep locomotion stationary or teleport-based;
- keep instructions readable on desktop and in a headset;
- target at least 72 FPS on the intended device;
- provide keyboard or pointer controls for development when practical.

## 3. Add the route

Create:

```text
apps/web/app/simulations/<slug>/page.tsx
```

Load the viewer dynamically with server-side rendering disabled because Three.js and WebXR browser APIs are client-only:

```tsx
'use client';

import dynamic from 'next/dynamic';

const Viewer = dynamic(
  () => import('@/components/simulations/MySimulationViewer'),
  { ssr: false }
);

export default function MySimulationPage() {
  return <Viewer />;
}
```

## 4. Register it in the catalog

Add an entry to `SIMS` in:

```text
apps/web/app/simulations/page.tsx
```

The entry's `slug` must match the route folder exactly.

## 5. Add assets safely

Put browser-served models, textures, and audio under `apps/web/public/simulations/<slug>/`. Prefer compressed glTF/GLB models and compressed textures. Keep licenses and attribution beside third-party assets.

Do not load production simulation assets from external URLs; the platform is designed for offline school deployments.

## 6. Verify

Run from `apps/web`:

```bash
npm run type-check
npm run build
npm run dev
```

Then verify the catalog link, desktop fallback, headset entry, controller interaction, cleanup after leaving the route, 72 FPS target, session timing, and comfort/safety cues.
