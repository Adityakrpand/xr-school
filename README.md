# XR School

Offline-first K-12 XR simulation platform. The current web prototype uses Next.js, React, TypeScript, and Three.js and includes pollination and electric-circuit simulations.

## Requirements

- Node.js 22 or newer (the repository's `.nvmrc` selects Node 23)
- npm 10 or newer
- A WebXR-capable browser and headset for immersive-device testing

## Start the web app

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000/simulations`. Desktop controls can be used while developing; validate interaction, performance, and comfort on the target headset before release.

## Validate changes

From `apps/web`:

```bash
npm run type-check
npm run build
```

From the repository root:

```bash
npm install
npm test
```

## Create a simulation

Follow [Creating a VR simulation](docs/simulation-design/creating-a-simulation.md). The existing `pollination` and `circuit` modules are working examples.

The broader learning, safety, and comfort requirements are defined in [Simulation Design System](docs/simulation-design/simulation-design-system.md).
