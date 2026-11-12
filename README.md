# XR School

Offline-first K-12 WebXR simulations for Indian schools. The repository contains a Next.js/Three.js web app, a Fastify API, TypeSpec API contracts, and simulation validation tests.

## Prerequisites

- Node.js 22.13.1 or newer in the Node 22 line (`.nvmrc` and `.node-version` are included)
- npm 10+
- A Chromium-based browser for desktop testing
- Meta Quest Browser on the same local network for headset testing
- OpenSSL on `PATH` only when using the local HTTPS/WebXR proxy

No environment variables or external services are required for local development.

## First-time setup

```powershell
npm ci
npm run quality
npm run build
```

## Run locally

Open separate terminals in the repository root:

```powershell
npm run dev:web
npm run dev:api
```

- Web app: http://localhost:3000
- API health: http://localhost:3001/health
- Simulation catalog: http://localhost:3001/v1/simulation-modules

## Test on a Meta Quest

WebXR requires a secure context. Keep `npm run dev:web` running, then start the proxy in another terminal:

```powershell
npm run dev:https
```

The command prints the headset URL, normally `https://<computer-lan-ip>:3443`. Open it in Quest Browser and accept the local development certificate warning. The computer and headset must be on the same network, and Windows Firewall must allow inbound TCP 3443.

## Add a simulation

Use the existing `pollination` and `circuit` implementations as reference.

1. Add the simulation metadata to `apps/api/src/index.ts`. Use only `strongVrFit` or `arTabletFit`, and include a meaningful XR-fit justification and learning objective.
2. Add `apps/web/components/simulations/<Name>Viewer.tsx`.
3. Add `apps/web/app/simulations/<slug>/page.tsx`; it must begin with `'use client'` and load the viewer without server-side rendering.
4. Add the slug/viewer mapping to `scripts/validate-simulations.mjs` when the filename is not the automatic PascalCase form.
5. Run the mandatory checks:

```powershell
npm run quality
npm run build
```

Before designing a module, read `docs/simulation-design/simulation-design-system.md`, `docs/ontology/simulation-ontology.md`, and `docs/ai-boundaries/ai-agent-boundaries.md`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev:web` | Start the Next.js app on port 3000 |
| `npm run dev:api` | Start the Fastify API on port 3001 with reload |
| `npm run dev:https` | Expose the web app over local HTTPS on port 3443 |
| `npm run validate:simulations` | Check simulation metadata, pages, viewers, and contracts |
| `npm run contract:compile` | Regenerate `generated/openapi/openapi.json` from TypeSpec |
| `npm run quality` | Run contracts, tests, type checks, lint, and simulation validation |
| `npm run build` | Build the API and production web app |

Do not edit `generated/openapi/openapi.json` manually; update `contracts/typespec/main.tsp` and compile it.
