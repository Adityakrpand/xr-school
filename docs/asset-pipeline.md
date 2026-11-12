# XR School asset pipeline

Use external assets only when they improve the learning outcome. Geometry, graphs, particles, labels, and simple lab equipment should remain procedural so they are small, exact, and easy to recolor.

## Preferred sources

| Need | First choice | Runtime target |
| --- | --- | --- |
| General 3D model | Quaternius, then a per-asset licensed Sketchfab/Fab model | GLB, <= 12 MB, <= 100k visible triangles |
| Anatomy | BodyParts3D | Separate labelled organs; simplified Quest LOD required |
| Space | NASA 3D Resources | GLB conversion; retain NASA source metadata |
| Environment | Quaternius or Fab | Modular GLB; baked lighting where possible |
| Texture/HDRI | Poly Haven, then ambientCG | 1K WebP/KTX2; HDRI <= 2K/4 MB |
| Animation | Mixamo | Retarget once, remove unused tracks |
| Character | Ready Player Me | Half-body or reduced LOD for classroom scenes |
| Audio | Pixabay or Freesound | Mono narration/SFX where spatial stereo is unnecessary |

The license belongs to the individual asset, not merely its hosting website. Record source URL, author, exact license, download date, modifications, and attribution before an asset is accepted. Do not import assets with unclear redistribution terms.

## Acceptance requirements

- Prefer GLB with Draco or Meshopt compression; merge static meshes and remove hidden geometry.
- Provide a low-cost fallback for every visual asset. Scientific state and assessment logic must never depend on a cosmetic asset.
- Cap textures at 1K for Quest by default and 2K only for a demonstrated close-up need.
- Use no more than one 2K environment map, one shadow-casting light, and 100 draw calls in the normal Quest view.
- Stream lesson video on learner action with `preload="metadata"`; do not preload full video during scene startup.
- Keep audio clips under 2 MB and normalize speech for inexpensive classroom headphones.
- Run `npm run assets:audit` before committing assets. A simulation package should still meet the package budget declared in the curriculum catalog.

## Current decisions

- Geometry Maths Lab stays procedural; an external model would add download cost without educational value.
- Human Body Anatomy may later replace its video with labelled BodyParts3D organ LODs. Until then, the existing local video loads metadata only and starts on learner interaction.
- Galaxy and microscope videos also load metadata only. Their current files remain below the 50 MB transition limit, but future replacements should prefer shorter WebM/MP4 renditions and poster frames.
