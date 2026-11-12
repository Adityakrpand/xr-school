# What Floats, What Sinks? — Simulation Design

## Module definition

- **Slug:** `float-sink-water`
- **Curriculum:** Class 5 Science, Chapter 7: Experiments with Water
- **Boards:** CBSE, ICSE, and state boards using the supplied chapter activity
- **Format:** `immersiveVr`
- **Status:** `approved` pending internal and school pilots
- **Evidence confidence:** `expertDesigned`
- **Duration:** 5 minutes; hard stop at 8 minutes
- **Comfort risk:** `low` — stationary viewpoint, no artificial locomotion, flashes, heights, or enclosed spaces
- **Performance target:** 72 FPS on Meta Quest; procedural geometry and no external assets
- **Estimated package size:** Under 15 MB as part of the web content pack

## XR fit justification

The learner conducts the experiment rather than watching a demonstration: they inspect, predict, grab, and release each object, then follow its entire path through a transparent tank. Immediate, repeatable trials and the side-by-side density reveal make the invisible comparison with water spatial and observable, while a physical classroom demonstration usually restricts visibility and participation to a few students.

## Learning objective

Students will predict, test, and correctly classify familiar objects as floating or sinking, then explain the observations using average density relative to water.

## Learning design

- **Scientific concept:** An object generally floats when its average density is lower than water and sinks when it is greater than water.
- **Prerequisite:** Familiarity with water, common materials, and observation-based comparison.
- **Misconceptions addressed:** Bigger objects always sink; small objects always float; heavy objects always sink; floating depends only on shape.
- **Visualization strategy:** A transparent tank keeps the surface, submerged path, and bottom visible together. Water ripples mark entry, and a wooden block and coin remain side by side during the density explanation.
- **Interaction strategy:** Try–Predict–Observe–Explain. Desktop/touch controls mirror controller selection; Quest controllers support trigger grab and release. The final VR challenge maps the left controller to FLOATS and right controller to SINKS.
- **Imagination helper:** The scene explicitly compares a large wooden block at the surface with a small coin at the bottom to separate size from average density.

## Five-scene flow

1. **Meet the objects:** Predict float or sink for wood, an empty sealed bottle, a coin, a stone, a rubber ball, and an apple.
2. **Water experiment:** Grab/drop each object; buoyancy animation and a ripple show the result. One star is awarded for each correct prediction.
3. **Density reveal:** Compare the floating wooden block and sunken coin. Confront the “bigger means sinks” misconception.
4. **Scientist challenge:** Sort a wooden spoon, iron nail, and sealed empty bottle into FLOATS or SINKS.
5. **Mission complete:** Recap the concept and award the Junior Water Scientist badge.

## Cue cards

1. “Inspect all six objects. Predict whether each will float or sink.” Student action: make all six predictions.
2. “Select an object, then drop it into the transparent tank.” Student action: test every object.
3. “Compare the wooden block and metal coin. Which has greater average density?” Student action: observe surface and bottom together.
4. “Sort the spoon, nail, and sealed bottle into FLOATS or SINKS.” Student action: classify all three.
5. “You tested evidence, corrected predictions, and explained the result with density.” Student action: state the rule aloud.

## Assessment hooks

- **Pre-check:** Six float/sink predictions before any outcome is shown.
- **Micro-check:** After each trial, compare the prediction with observed evidence.
- **Post-check:** Classify three new/familiar objects without first seeing the result.
- **Success evidence:** Six prediction records, six completed trials, three challenge classifications, and a score out of nine. Data remains local and batch-level.

## Instructor script

### 1. Setup

Ask: “Does a big object always sink? Does a small object always float?” Non-headset students complete a nine-row prediction and observation sheet. Remind the headset group to remain standing or seated in one spot and move only their arms.

### 2. During the headset batch

At prediction time, ask for a reason without confirming the answer. During drops, prompt students to follow the object all the way to the surface or bottom. At the density reveal, point out the large block and small coin together. Check comfort midway and stop if a learner feels unwell.

### 3. Debrief

Compare class predictions with observations. Address “heavy always sinks” by discussing the sealed bottle and trapped air, and “big always sinks” with the wooden block. Connect the evidence to the chapter language: lower average density than water generally floats; greater density sinks.

### 4. Revision trigger

After one week, ask students to predict a leaf, steel spoon, capped bottle, and lump of clay. After one month, revisit how changing shape or trapped air can change average density and floating behaviour.

## Batch companion activity

Non-headset students use a three-column table: object, prediction with reason, observed result. After every two headset trials, pairs compare whether evidence supported their prediction. At the end, the class proposes one safe physical follow-up object and explains its predicted behaviour.

## Safety and accessibility

- Stationary camera and optional desktop orbit only; no continuous VR locomotion.
- No flashes, sudden camera cuts, or forced underwater movement.
- Spoken narration is duplicated in concise on-screen and in-world cue cards.
- Controls use large targets, high contrast, text labels, and `aria-live` feedback.
- The experience works without audio and provides browser controls when WebXR is unavailable.
