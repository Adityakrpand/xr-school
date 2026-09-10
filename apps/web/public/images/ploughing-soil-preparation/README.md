# Ploughing field panorama

`farm-panorama.png` was generated with OpenAI's built-in image generation tool on 2026-09-07 for this XR School simulation.

Final prompt: a photorealistic, seamless 2:1 equirectangular rural Indian farm immediately after harvest, with compact dry soil, cracks, crop stubble, distant village buildings and trees, a level horizon, warm sunrise, and an open central area for interactive 3D props. It explicitly excludes people, animals, machinery, text, logos, watermarks, fantasy styling and fisheye distortion.

The generated background is representational. The interactive ploughing tools and scientific soil evidence are deterministic Three.js geometry authored in the application.

## Soil material

`soil-albedo-v2.jpg` was generated with OpenAI's built-in image generation tool on 2026-09-08, then resized to 1024 pixels and compressed for standalone-headset performance.

Final prompt: a photorealistic, seamless, top-down game-material texture of dry Indian agricultural loam immediately before ploughing. It requests compact cracked earth, varied small clods, fine grit, sparse short straw and crop-stubble fibres, uniform diffuse daylight and high-frequency detail. It excludes a horizon, sky, plants, people, animals, machinery, tools, labels, logos, borders, watermarks, illustration styling, directional shadows and perspective distortion.

The application tiles this texture across compact, loosened and levelled soil and reuses a no-colour-space clone as a subtle bump map. The procedural 3D geometry remains the source of truth for clods, furrows and soil layers.

## Scene-specific 360° environments

`traditional-ploughing-v2.jpg` and `modern-cultivator-v2.jpg` were generated with OpenAI's built-in image generation tool on 2026-09-08 and compressed for standalone-headset delivery.

- Traditional prompt: a photorealistic 2:1 equirectangular documentary view of a rural Indian field at sunrise, with an adult farmer guiding a wooden plough pulled by two light-grey Indian zebu bullocks. The team is kept in the left mid-distance, the central foreground is open for interactive props, the plough visibly turns soil, and cartoons, malformed anatomy, modern machinery, text, logos and watermarks are excluded.
- Modern prompt: a photorealistic 2:1 equirectangular documentary view of a large Indian field, with a real green tractor pulling a connected red multi-tine cultivator in the left mid-distance. Freshly loosened soil is visible behind the tines, the central foreground is open, and toy proportions, disconnected machinery, excessive dust, text, logos and watermarks are excluded.

These panoramas provide authentic visual context. The foreground 3D tractor, bullock team, plough, cultivator and soil are still the interactive teaching apparatus.
