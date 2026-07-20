# Digestive simulation asset pack

All GLB files in this directory are original procedural assets generated for XR School by `scripts/generate-digestive-assets.mjs`.

- Source: XR School procedural asset generator
- Author: XR School project contributors
- License: CC0 1.0 Universal
- Format: binary glTF 2.0 (`.glb`)
- Intended use: offline Meta Quest 3/3S educational simulations
- Regeneration: run `node scripts/generate-digestive-assets.mjs`

The pack deliberately avoids external textures and third-party meshes. This keeps redistribution clear, enables deterministic rebuilding, and provides small local assets with the existing procedural scenes as runtime fallbacks.
