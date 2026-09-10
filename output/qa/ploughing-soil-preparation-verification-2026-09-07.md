# Ploughing: Preparation of Soil — verification

Date: 2026-09-08
Route: `/simulations/c8-ch01-a01-ploughing-preparation-of-soil`

## Delivered experience

- Eight gated scenes: field observation, hard-soil decision, traditional plough inspection, three-furrow task, modern-method comparison, underground soil cutaway, clod breaking and levelling, and field-ready assessment.
- Seventeen physical scene targets with pointer and Quest-controller ray selection.
- Orbit, pan, zoom, reset-view and full-screen browser controls.
- Quest locomotion, snap turning, primary action, narration replay and B-button immersive-session exit.
- Four-question end assessment and a deterministic restart.
- Eight packaged Neerja Expressive Indian-English MP3 narration clips with visible captions and replay controls.
- Three stage-matched, photorealistic Indian farm panoramas: the harvested field, traditional zebu-bullock ploughing and modern tractor-cultivator work.
- Detailed interactive foreground apparatus: textured soil and stubble, articulated Indian bullocks, wooden plough and iron share, tractor controls and treaded wheels, curved cultivator tines, animated dust, layered underground soil, branched roots, air spaces, earthworm, nutrients, clods, leveller and seed bag.
- Stage-specific lighting and camera framing keep the learning object close enough for classroom and headset inspection.

## Verification evidence

- Focused lesson, 3D scene and narration tests: 10/10 passed.
- Repository regression suite: 152 files and 1,277 tests passed.
- TypeScript check: passed.
- Next.js optimized production build: passed; route prerendered as static content.
- Production HTTP route: 200.
- Production traditional panorama: 200, 687,803 bytes.
- Production modern panorama: 200, 691,012 bytes.
- Production soil material: 200, 717,309 bytes.
- Production first narration asset: 200, 87,696 bytes.
- Source formatting and whitespace check: passed.

## Manual checks completed

- Loaded the route in a real browser.
- Completed the opening observation and hard-soil decision.
- Inspected the traditional plough, bullocks and turned soil.
- Made three furrows and inspected a furrow.
- Inspected the tractor and cultivator and completed the modern-method comparison.
- Opened and inspected the underground soil cutaway.
- Confirmed the stage-specific camera framing and responsive learning panel through these scenes.
- Re-ran the traditional and modern scenes from a fresh optimized production build and visually confirmed the contextual panorama switches and interactive foreground models.

## Remaining release boundary

- Meta Quest hardware acceptance has not been signed off in this environment. The implementation and automated contracts cover controller selection, locomotion and B-button exit, but a final physical-headset run is still required before calling this school-validated.
- This is a direct test route and has not been deployed to Vercel in this task.
