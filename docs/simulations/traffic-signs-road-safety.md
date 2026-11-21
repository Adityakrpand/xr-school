# The Smart Road Adventure

## Module identity

- **Slug:** `traffic-signs-road-safety`
- **Source:** Chapter 12, “What If It Finishes..?”, Activity 1 — Important Traffic Signs and Rules
- **Grade:** Class 5 (`class3To5`)
- **Subjects:** Science and Environmental Science
- **Format:** Stationary immersive VR with an equivalent browser interaction path
- **Duration:** 5 minutes; hard stop below the Class 1–5 eight-minute comfort limit
- **Evidence level:** `expertDesigned`
- **Lifecycle:** `approved` for internal pilot

## Learning design

**Learning objective:** Students will identify the STOP, NO ENTRY, SPEED LIMIT 40, and SCHOOL AHEAD signs; interpret red, yellow, and green traffic signals; and independently perform the complete safe zebra-crossing sequence.

**XR-fit justification:** A stationary virtual junction lets every learner practise high-consequence road decisions repeatedly without exposure to real traffic. The city responds immediately to signs, lights, and crossing choices, making cause, consequence, visibility, and safe sequencing spatial in a way a worksheet or video cannot provide.

**Misconception addressed:** A pedestrian can cross safely wherever there is a gap in traffic, including between parked cars. The pre-check records this belief, and the crossing challenge shows that parked cars hide pedestrians from approaching drivers.

**Interaction strategy:** Progressive reveal plus before/after understanding checks. Learners restore signs, operate the signal sequence, choose a crossing location, perform seven ordered crossing actions, and complete a five-question corrective-feedback test.

## Cue cards

1. The signs have disappeared. Help Robo make every road safe again.
2. Place each sign back beside the road and study what it tells road users.
3. Activate red, yellow, and green in the safe order and watch traffic respond.
4. Choose the safe crossing, then perform every road-crossing action in order.
5. Use evidence from the city to answer all five questions.
6. Review the golden road-safety rules and accept the Traffic Safety Hero badge.

## Assessment hooks

### Before check — non-scoring

“Where is the safest place to cross: at a zebra crossing or between parked cars?” The response is recorded only as immediate formative feedback and does not affect the final badge.

### Post-check — five questions

1. STOP sign → stop completely.
2. NO ENTRY → vehicles cannot enter.
3. Red signal → stop.
4. Pedestrian crossing → zebra crossing.
5. SCHOOL AHEAD → slow down and watch for children.

Incorrect choices give an explanation and allow a retry. Completion requires five correct answers.

## Instructor script

### 1. Setup

Ask: “If there were no signs or signals, how would drivers and pedestrians know what to do?” Explain that the headset learner will repair a virtual junction while the rest of the class predicts each safe action.

### 2. During the headset batch

- Ask learners to say each sign’s instruction aloud after restoring it.
- At the signal, reinforce that yellow means prepare to stop, not speed up.
- Before crossing, ask the class to call out the right–left–right sequence without revealing the next button.
- Keep learners stationary; pause immediately if anyone reports discomfort.

### 3. Debrief

Discuss why crossing between parked cars is dangerous even when no moving vehicle is visible. Connect visibility, stopping distance, and predictable road behaviour to the signs and zebra crossing seen in the simulation.

### 4. Revision trigger

After one week, show one sign or crossing scenario and ask learners to state the safe action and the reason. Repeat the same prompt after one month with a different sign.

## Companion activity

Non-headset students keep a four-column safety log: **sign or signal**, **instruction**, **what could go wrong if ignored**, and **evidence observed in the simulation**. Pairs compare logs before the full-class debrief.

## Revision card

**Prompt:** “You are standing between two parked cars and can see no moving vehicle. Should you cross?”

**Answer:** No. Walk to a zebra crossing, stop, look right–left–right, listen, confirm vehicles have stopped, and walk straight across.

## Comfort, safety, and performance

- **Comfort risk:** `low`
- Stationary viewpoint with orbit/look controls; no artificial locomotion.
- No flashes, collisions, crash sounds, or threatening near-miss events.
- Moving vehicles use simple low-polygon geometry and stop during the signal lesson.
- Reduced-motion preference stops vehicle and robot animation.
- Target: 72 FPS on Meta Quest; estimated module-specific assets below 5 MB because all geometry is procedural.
- Browser controls have 44-pixel minimum targets, live feedback, keyboard access, narration replay, and descriptive canvas semantics.
