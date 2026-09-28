import type { SimulationModuleRecord } from "@xr-school/simulation-schema";

const pollinationScript = `SETUP
Ask the class why flowers are brightly coloured and what might move pollen between plants. Non-headset students sketch a flower and predict where pollen travels.

DURING HEADSET BATCH
Guide students through the garden stages: flower parts, pollen, pollinator arrival, cross-pollination, fertilisation, seed formation, germination, and new plant growth. Pause when pollination and fertilisation are contrasted.

DEBRIEF
Ask students to sequence the process and explain why pollination is not the same as fertilisation. Connect the VR stages to the textbook flower diagram.

REVISION TRIGGER
One week later, show a flower diagram and ask students to identify the stage where pollen transfer happens and the stage where seed formation begins.`;

const circuitScript = `SETUP
Show a simple circuit diagram and ask students to predict what happens when the switch opens and closes. Non-headset students calculate current for 9V with 10 ohm, 50 ohm, and 200 ohm resistors.

DURING HEADSET BATCH
Have students toggle the switch, observe electron flow, change resistance, and compare current with bulb brightness. Pause at each resistor change for a predict-observe-explain prompt.

DEBRIEF
Ask why the bulb becomes dimmer when resistance increases. Connect the visible electron flow to Ohm's Law, V = I x R.

REVISION TRIGGER
In the next session, give one new resistor value and ask students to predict current and relative brightness before calculating.`;

const statesOfMatterScript = `SETUP
Ask students what changes when ice becomes water and water becomes vapour. Non-headset students predict how particle spacing and speed differ in solids, liquids, and gases.

DURING HEADSET BATCH
Guide students through solid, liquid, gas, and phase-change stages. Ask them to adjust heat and observe particle motion, spacing, shape, and container behaviour.

DEBRIEF
Compare the three particle arrangements and ask why gases fill the container while solids keep their shape. Connect observations to kinetic particle theory.

REVISION TRIGGER
One week later, show particle diagrams and ask students to identify the state and explain what heating or cooling would do next.`;

const sourcesOfFoodScript = `SETUP
Ask students to name foods from their last meal and predict whether each came mainly from a plant, an animal, or fungi. Non-headset students prepare a three-column sorting table.

DURING HEADSET BATCH
Guide students through the pantry, farm, dairy, and market stations. Ask them to inspect each food token, place it on the correct source platform, and explain the visible clue before confirming.

DEBRIEF
Review any misplaced foods and separate everyday food names from biological source categories. Connect grains, pulses, fruits, milk, eggs, honey, and mushrooms to their living sources.

REVISION TRIGGER
One week later, give a mixed meal and ask students to classify every ingredient by source and justify one tricky example.`;

const solubilityScript = `SETUP
Place salt, sugar, sand, chalk powder, and oil on a table and ask students to predict which will dissolve in water. Non-headset students prepare a predict-observe-explain table.

DURING HEADSET BATCH
Guide students through each safe virtual trial. Ask them to choose a substance, make a prediction, add it to water, stir, and observe whether the mixture becomes clear, cloudy, settled, or separated.

DEBRIEF
Compare soluble and insoluble substances and separate dissolving from melting, floating, and simply disappearing. Ask students why sand remains visible while salt does not.

REVISION TRIGGER
One week later, show a new material and ask students to predict solubility, state the evidence they would look for, and describe a fair test.`;

const digestiveSystemScript = `SETUP
Ask students where a bite of food goes after they swallow it. Non-headset students draw a simple body outline and predict the order of the organs.

DURING HEADSET BATCH
Guide students through the ten stages from the mouth to waste removal. Pause at each interaction so students connect the visible action—chewing, muscle waves, churning, absorption, and water recovery—to the organ's function.

DEBRIEF
Ask students to sequence Mouth, Esophagus, Stomach, Small Intestine, Large Intestine, Rectum, and Anus. Review how the liver, gallbladder, and pancreas support the pathway without food passing through them.

REVISION TRIGGER
One week later, show an unlabeled digestive-system pathway and ask students to label the organs, name where nutrients and water are absorbed, and explain one healthy digestion habit.`;

const breathingProcessScript = `SETUP
Ask students what they feel move when they take a deep breath. Non-headset students place a hand on their ribs and chest and describe what happens on an inhale and an exhale.

DURING HEADSET BATCH
Guide students through the airway, lungs, and diaphragm, then have them trigger an inhale and an exhale in turn. Pause at each trigger so students connect the diaphragm's shape and position to the rib cage and lung volume.

DEBRIEF
Ask students to explain, in their own words, why the diaphragm contracting causes air to move into the lungs. Review the alveoli as the site of gas exchange.

REVISION TRIGGER
One week later, show an unlabeled rib cage and diaphragm diagram and ask students to mark the diaphragm's position during an inhale versus an exhale and explain the pressure change that results.`;

const forceMotionScript = `SETUP
Ask students to predict what happens to a ball sitting still on the floor if nobody touches it. Non-headset students list five ways they used a push or pull today.

DURING HEADSET BATCH
Have students push the ball into motion, brake it to a stop, push harder to speed it up, push sideways to redirect it, then squeeze and release a second ball. Pause at each trigger to name which effect of force just happened.

DEBRIEF
Ask students to list the five effects of force they just caused: starting motion, stopping motion, speeding up, changing direction, and changing shape. Ask whether the squeezed ball's shape change was permanent.

REVISION TRIGGER
One week later, show a photo of a stretched rubber band and a dented can and ask students which shape changes are elastic (spring back) and which are not, and to name the effect of force in each case.`;

const ploughingPreparationScript = `SETUP
Show students a tray of hard, compact soil and ask whether seeds and young roots could grow well in it. Non-headset students predict what a farmer must change before sowing.

DURING HEADSET BATCH
Guide students through the harvested field, hard-soil inspection, bullock-drawn plough, three-furrow task, tractor and cultivator comparison, underground cutaway, clod breaking, levelling and final field assessment. Pause before each reveal so students predict what will change.

DEBRIEF
Ask students to explain how loosening soil helps roots, air, water, earthworms and manure. Compare the speed and scale of traditional and modern methods without treating either as universally better.

REVISION TRIGGER
One week later, show hard, ploughed and levelled soil photographs and ask students to put them in preparation order and justify each transition.`;

const sowingSeedsScript = `SETUP
Show a mixed sample of healthy, broken and damaged seeds. Ask students which seeds they would sow and what else a farmer must control after selecting them.

DURING HEADSET BATCH
Guide students through the prepared seedbed, meaning of sowing, healthy-seed selection, float-and-sink observation, depth comparison, spacing repair, traditional funnel tool, modern seed drill and germination cutaway. Require evidence at every scene before moving on.

DEBRIEF
Ask students to explain why seed quality, suitable depth and even spacing all affect crop establishment. Treat the water activity as one observation rather than a universal guarantee of viability, and compare traditional and modern tools by precision, scale and context.

REVISION TRIGGER
One week later, give students cards showing seed selection, sowing, covering and germination. Ask them to arrange the sequence and annotate the depth, spacing and germination conditions needed for a healthy row.`;

const amoebaNutritionScript = `SETUP
Show students a drop of pond water and ask whether it might contain living organisms too small to see. Non-headset students sketch what they expect an amoeba to look like and predict how it could eat without a mouth.

DURING HEADSET BATCH
Guide students through pond-water collection, the microscope transition, finding a shape-changing amoeba, inspecting its cell parts, capturing food with pseudopodia, digestion inside a food vacuole, absorption and assimilation in the cytoplasm, egestion, and the ordered nutrition cycle. Pause before every process name so learners describe the visible event first.

DEBRIEF
Ask students to distinguish ingestion, digestion, absorption, assimilation and egestion. Review that pseudopodia are temporary extensions, that digestion occurs in a food vacuole, and that the amoeba is one cell rather than a tiny many-celled animal.

REVISION TRIGGER
One week later, show five shuffled nutrition-stage cards and an unlabelled amoeba diagram. Ask students to order the stages, label pseudopodia and the food vacuole, and explain one piece of visible evidence for each label.`;

const woolProcessingScript = `SETUP
Show students a raw fleece sample or photograph and ask what must happen before it can become clean wool for yarn. Non-headset students make two headings: shearing and scouring.

DURING HEADSET BATCH
Guide students through Flock Valley with Woolly and Dr Asha. Ask them to inspect the fleece, choose the safe season and equipment, follow the shearing paths, identify four impurities, compare three washing conditions, operate the scouring station, and rebuild the six-step wool journey. Pause after each decision so students explain the animal-care or fibre evidence.

DEBRIEF
Ask students to distinguish shearing from scouring in one sentence each. Review why sheep are generally sheared in warm weather, why raw fleece contains lanolin and dirt, and why controlled warm washing and gentle handling protect wool fibres.

REVISION TRIGGER
One week later, give students six shuffled cards—sheep, shears, raw fleece, washing, rinsing and drying—and ask them to order the process and identify where shearing ends and scouring begins.`;

const moneyTownScript = `SETUP
Show Indian coins and notes and ask students to name where they have seen them used. Non-headset students prepare a simple shop table with item prices.

DURING HEADSET BATCH
Guide students through Magic Money Town. Ask them to inspect coins and notes, identify values, buy simple items, and match money to prices using playful shop interactions.

DEBRIEF
Ask students to separate coins from notes, name the values, and explain why we count money carefully before buying.

REVISION TRIGGER
One week later, show mixed coin and note pictures and ask students to identify each value and choose enough money for one simple item.`;

const prepositionAdventureScript = `SETUP
Place a toy, box, table, and chair in front of the class. Ask students to describe where the toy is using words such as in, on, under, behind, and between.

DURING HEADSET BATCH
Guide students through a child-friendly adventure where they place objects in different positions and hear the correct preposition in context after each action.

DEBRIEF
Ask students to act out each preposition with classroom objects, then speak one sentence using the target word.

REVISION TRIGGER
One week later, show three position pictures and ask students to choose the matching preposition and say a complete sentence.`;

const solarSystemMissionScript = `SETUP
Pose the central question: what keeps eight worlds circling one star, and why don't they all move alike? Collect predictions for the hottest planet and the fastest orbit. Non-headset students prepare a planet-order strip and write their two predictions on it.

DURING HEADSET BATCH
Students explore a live orbiting solar system: they switch on the gravity lens, race Mercury against Earth and Mars, probe Mercury and Venus with the infrared thermometer, tour the four giants, pull the true-scale lever, and ride a comet through perihelion. Narrate each prediction moment aloud and ask students to say their guess before acting.

DEBRIEF
Confront the predictions with the recorded evidence: Venus beat Mercury on the thermometer, Mercury won the orbit race, the true-scale lever showed mostly empty space, and the comet tail pointed away from the Sun. Ask students to explain each surprise using the Sun's gravity or the greenhouse effect.

REVISION TRIGGER
One week later, ask: a new probe orbits at twice Earth's distance — is its year longer or shorter, and why? Then have students sketch a comet's tail on both sides of its orbit.`;

export const POLLINATION_MODULE: SimulationModuleRecord = {
  id: "sim-pollination-001",
  slug: "pollination",
  viewerKey: "pollination",
  legacyAliases: [],
  title: "Plant Pollination & Growth Cycle",
  summary:
    "Walk through a flowering garden. Watch pollen transfer, seed formation, germination, and a full plant life cycle unfold in immersive VR.",
  gradeBands: ["class6To8", "class9To10"],
  subjects: ["biology", "environmentalScience"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: [
    "cm-biology-pollination-class6to8",
    "cm-biology-plant-reproduction-class9to10",
  ],
  conceptIds: [
    "concept-flower-structure",
    "concept-pollination",
    "concept-fertilisation",
    "concept-seed-germination",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Pollination occurs at a scale and speed students cannot witness directly in class. VR lets them stand inside a living garden, follow pollen transfer spatially, and see the hidden transition from pollination to fertilisation and seed formation.",
  learningObjective:
    "Students will be able to sequence the 8 stages of plant reproduction from pollen production through germination.",
  scientificConceptExplanation:
    "Flowering plants reproduce when pollen from the stamen reaches a stigma, enabling fertilisation inside the ovary. The fertilised ovule becomes a seed, and the seed can germinate into a new plant when conditions are suitable.",
  misconceptionsAddressed: [
    "Pollination and fertilisation are the same event.",
    "A seed appears as soon as pollen touches a flower.",
    "Pollinators help only animals, not plants.",
  ],
  visualizationStrategy:
    "Use a 360-degree garden with enlarged pollen particles, a close pollinator path, and progressive underground seed and seedling stages.",
  interactionStrategy:
    "Students advance through eight guided stages, inspect flowers from inside the garden, and use cue cards to compare pollination, fertilisation, seed formation, and germination.",
  imaginationHelperStrategy:
    "Invisible pollen transfer is rendered as visible golden particles moving between flower structures.",
  cueCardIds: [
    "cue-pollination-001",
    "cue-pollination-002",
    "cue-pollination-003",
    "cue-pollination-004",
    "cue-pollination-005",
    "cue-pollination-006",
    "cue-pollination-007",
    "cue-pollination-008",
  ],
  revisionCardIds: ["rev-pollination-sequence-001"],
  assessmentHookIds: [
    "assess-pollination-pre-001",
    "assess-pollination-post-001",
    "assess-pollination-misconception-001",
  ],
  instructorScript: pollinationScript,
  batchActivityPrompt:
    "Draw and label a flower, then mark where pollen starts, where it lands, and where the seed begins forming.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use seated or stationary play.",
    "Ask students to pause if the close pollinator movement feels uncomfortable.",
  ],
  offlineContentPackId: "pack-science-plant-reproduction-v1",
  estimatedPackageSizeMb: 260,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 8,
  status: "released",
};

export const CIRCUIT_MODULE: SimulationModuleRecord = {
  id: "sim-circuit-001",
  slug: "circuit",
  viewerKey: "circuit",
  legacyAliases: [],
  title: "Electric Circuits & Resistance (Ohm's Law)",
  summary:
    "Toggle a switch, swap resistors, and watch electrons flow in real time. Discover V=IR through direct interaction with a 3D circuit.",
  gradeBands: ["class6To8", "class9To10"],
  subjects: ["physics"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: [
    "cm-physics-electricity-class6to8",
    "cm-physics-ohms-law-class9to10",
  ],
  conceptIds: [
    "concept-electric-current",
    "concept-closed-circuit",
    "concept-resistance",
    "concept-ohms-law",
  ],
  simulationFormat: "interactive3d",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Electric current is invisible in classroom circuits, so students often memorize symbols without understanding flow. VR renders current as visible moving particles and gives immediate feedback between resistance, current, and bulb brightness.",
  learningObjective:
    "Students will apply Ohm's Law (V=IR) to predict how changing resistance affects current and explain observations in a series circuit.",
  scientificConceptExplanation:
    "A closed circuit provides a complete path for charge flow. For a fixed voltage source, current decreases as resistance increases according to I = V / R, reducing the energy delivered to the bulb filament.",
  misconceptionsAddressed: [
    "Current is used up by the bulb.",
    "A switch creates current instead of completing a path.",
    "Higher resistance makes current move faster.",
  ],
  visualizationStrategy:
    "Use a workbench circuit where electrons, switch state, resistor values, bulb brightness, and the Ohm calculation are visible at the same time.",
  interactionStrategy:
    "Students toggle a switch and select resistor values while observing the resulting current, bulb brightness, and equation update.",
  imaginationHelperStrategy:
    "Invisible electron flow is rendered as moving blue particles around the circuit loop.",
  practicalUseCase:
    "Connects textbook circuit diagrams to torches, chargers, household wiring, and safe troubleshooting.",
  cueCardIds: [
    "cue-circuit-001",
    "cue-circuit-002",
    "cue-circuit-003",
    "cue-circuit-004",
  ],
  revisionCardIds: ["rev-circuit-ohms-law-001"],
  assessmentHookIds: [
    "assess-circuit-pre-001",
    "assess-circuit-post-001",
    "assess-circuit-misconception-001",
  ],
  instructorScript: circuitScript,
  batchActivityPrompt:
    "Complete a circuit table for three resistor values: predict current, observe brightness, and explain the trend.",
  expectedDurationMinutes: 8,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary workbench mode.",
    "Remind students this is a conceptual circuit model, not permission to handle live mains electricity.",
  ],
  offlineContentPackId: "pack-science-electricity-v1",
  estimatedPackageSizeMb: 220,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 4,
  status: "released",
};

export const STATES_OF_MATTER_MODULE: SimulationModuleRecord = {
  id: "sim-c09-ch01-a02-states-of-matter",
  slug: "c9-ch01-a02-states-of-matter",
  viewerKey: "states-of-matter",
  legacyAliases: [],
  title: "States of Matter Particle Lab",
  summary:
    "Manipulate heat in a particle chamber and watch solids, liquids, and gases change motion, spacing, shape, and volume.",
  gradeBands: ["class9To10"],
  subjects: ["chemistry", "physics"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c9-ch01-states-of-matter"],
  conceptIds: [
    "concept-states-of-matter",
    "concept-particle-motion",
    "concept-phase-change",
  ],
  simulationFormat: "interactive3d",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Particle motion and spacing are invisible in ordinary classroom demonstrations, so students often memorize state properties without a mental model. A VR particle chamber makes microscopic motion visible and lets students connect heating, cooling, shape, volume, and phase change in one manipulable scene.",
  learningObjective:
    "Students will compare solid, liquid, and gas particle behaviour and predict how heating or cooling changes state.",
  scientificConceptExplanation:
    "Matter is made of particles whose arrangement and kinetic energy determine observable state. Solids have tightly packed particles vibrating in place, liquids have nearby particles that flow past one another, and gases have fast particles spread far apart.",
  misconceptionsAddressed: [
    "Particles in solids do not move.",
    "Heating creates new particles instead of increasing kinetic energy.",
    "Gas particles float upward because they are weightless.",
  ],
  visualizationStrategy:
    "Use a transparent chamber with animated particles, a heat slider, state labels, and side-by-side particle spacing cues.",
  interactionStrategy:
    "Students switch between guided stages and adjust heating or cooling to observe particle speed, spacing, and container behaviour.",
  imaginationHelperStrategy:
    "Microscopic particles are enlarged and colour-coded so students can see motion patterns that are normally invisible.",
  practicalUseCase:
    "Connects melting, boiling, condensation, evaporation, weather, cooking, and storage of materials.",
  cueCardIds: [
    "cue-states-matter-001",
    "cue-states-matter-002",
    "cue-states-matter-003",
    "cue-states-matter-004",
  ],
  revisionCardIds: ["rev-states-matter-particles-001"],
  assessmentHookIds: [
    "assess-states-matter-pre-001",
    "assess-states-matter-post-001",
    "assess-states-matter-misconception-001",
  ],
  instructorScript: statesOfMatterScript,
  batchActivityPrompt:
    "Draw three particle boxes for solid, liquid, and gas, then write what happens to speed and spacing when heat is added.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary chamber mode.",
    "Avoid rapid camera movement; particles move inside the chamber while the student remains still.",
  ],
  offlineContentPackId: "pack-science-matter-class9-v1",
  estimatedPackageSizeMb: 240,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 4,
  status: "released",
};

export const SOURCES_OF_FOOD_MODULE: SimulationModuleRecord = {
  id: "sim-c06-ch01-a01-sources-of-food",
  slug: "c6-ch01-a01-sources-of-food",
  viewerKey: "sources-of-food",
  legacyAliases: [],
  title: "Sources of Food Sorting Lab",
  summary:
    "Sort common foods by source in a 3D pantry and learn how plant, animal, and fungal sources appear in everyday meals.",
  gradeBands: ["class6To8"],
  subjects: ["science", "biology"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c6-ch01-food-sources"],
  conceptIds: [
    "concept-food-sources",
    "concept-plant-products",
    "concept-animal-products",
    "concept-edible-fungi",
  ],
  simulationFormat: "interactive3d",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Students often memorize examples without seeing that meals are made from ingredients with different biological origins. A spatial sorting board lets them inspect food tokens, group them by source, and immediately correct common confusions such as mushroom, honey, milk, and grain sources.",
  learningObjective:
    "Students will classify everyday foods by plant, animal, or fungal source and justify the classification using observable clues.",
  scientificConceptExplanation:
    "Food materials come from living sources. Plant sources include grains, pulses, fruits, vegetables, oils, and spices; animal sources include milk, eggs, meat, fish, and honey; fungi such as mushrooms form a separate living group often used as food.",
  misconceptionsAddressed: [
    "All non-green foods come from animals.",
    "Milk and honey come from plants because they are sold with other groceries.",
    "Mushrooms are plants.",
  ],
  visualizationStrategy:
    "Use a 3D market table with source platforms, enlarged food tokens, source icons, and feedback beams that connect each item to its origin.",
  interactionStrategy:
    "Students inspect each item, choose a source platform, receive immediate feedback, and repeat until all foods are classified with a final misconception review.",
  imaginationHelperStrategy:
    "Invisible origin information is made visible by showing each food token beside its source environment: field, dairy/animal, or fungal growth patch.",
  practicalUseCase:
    "Connects textbook food-source classification to meals, shopping, farming, nutrition discussions, and ingredient labels.",
  cueCardIds: [
    "cue-food-sources-001",
    "cue-food-sources-002",
    "cue-food-sources-003",
    "cue-food-sources-004",
  ],
  revisionCardIds: ["rev-food-sources-classify-meal-001"],
  assessmentHookIds: [
    "assess-food-sources-pre-001",
    "assess-food-sources-post-001",
    "assess-food-sources-misconception-001",
  ],
  instructorScript: sourcesOfFoodScript,
  batchActivityPrompt:
    "Sort ingredients from a lunch plate into plant, animal, and fungal sources, then explain one item that was difficult.",
  expectedDurationMinutes: 9,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary table mode.",
    "Keep feedback visual and audio-light so students can discuss decisions with the instructor.",
  ],
  offlineContentPackId: "pack-science-food-sources-class6-v1",
  estimatedPackageSizeMb: 140,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 4,
  status: "released",
};

export const SOLUBLE_INSOLUBLE_MODULE: SimulationModuleRecord = {
  id: "sim-c05-ch07-a03-soluble-and-insoluble-substances",
  slug: "c5-ch07-a03-soluble-and-insoluble-substances",
  viewerKey: "solubility",
  legacyAliases: ["experiments-with-water-soluble-insoluble"],
  title: "Soluble and Insoluble Substances Lab",
  summary:
    "Run safe virtual water-mixing trials and observe which everyday substances dissolve, settle, cloud, or separate.",
  gradeBands: ["class3To5"],
  subjects: ["environmentalScience", "science"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c5-ch07-water-experiments"],
  conceptIds: [
    "concept-solubility",
    "concept-solution",
    "concept-mixture-observation",
  ],
  simulationFormat: "practicalLabSimulation",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Solubility is easy to demonstrate, but students often miss particle-level evidence and confuse dissolving with melting or disappearing. A resettable XR bench makes repeated trials fast, safe, visible, and discussion-friendly while showing magnified particle behaviour inside the beaker.",
  learningObjective:
    "Students will distinguish soluble and insoluble substances in water using prediction, observation, and evidence from repeated trials.",
  scientificConceptExplanation:
    "A soluble substance dissolves when its particles spread evenly through water to form a solution. Insoluble substances do not dissolve; they may settle, remain suspended, float, or form a separate layer depending on their properties.",
  misconceptionsAddressed: [
    "Dissolving means a substance disappears.",
    "Any powder will dissolve in water.",
    "Floating and dissolving are the same observation.",
  ],
  visualizationStrategy:
    "Use a virtual beaker with visible stirring, magnified particle trails, clarity changes, sediment, and separate oil layers for comparison.",
  interactionStrategy:
    "Students choose a substance, predict an outcome, run the trial, observe the beaker state, and compare the result with the prediction before resetting.",
  imaginationHelperStrategy:
    "Invisible dissolved particles are shown as tiny coloured dots spreading through water while insoluble particles remain visible and settle.",
  practicalUseCase:
    "Connects classroom water experiments to cooking, washing, soil, river water, filters, and separating mixtures.",
  cueCardIds: [
    "cue-solubility-001",
    "cue-solubility-002",
    "cue-solubility-003",
    "cue-solubility-004",
  ],
  revisionCardIds: ["rev-solubility-fair-test-001"],
  assessmentHookIds: [
    "assess-solubility-pre-001",
    "assess-solubility-post-001",
    "assess-solubility-misconception-001",
  ],
  instructorScript: solubilityScript,
  batchActivityPrompt:
    "Complete a predict-observe-explain table for five substances and write one sentence explaining how dissolving differs from disappearing.",
  expectedDurationMinutes: 8,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary lab bench mode.",
    "Reinforce that real experiments should use teacher-approved materials only.",
  ],
  offlineContentPackId: "pack-evs-water-experiments-class5-v1",
  estimatedPackageSizeMb: 135,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 5,
  status: "released",
};

export const DIGESTIVE_SYSTEM_MODULE: SimulationModuleRecord = {
  id: "sim-c05-ch03-a02-introduction-of-digestive-system",
  slug: "c5-ch03-a02-introduction-of-digestive-system",
  viewerKey: "digestive-system",
  legacyAliases: [],
  title: "Introduction to the Digestive System",
  summary:
    "Travel with food from the mouth through the digestive tract, activate each organ, absorb nutrients and water, and finish with a healthy-habits challenge.",
  gradeBands: ["class3To5"],
  subjects: ["environmentalScience", "biology"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c5-ch03-digestive-system"],
  conceptIds: [
    "concept-digestive-system",
    "concept-food-journey",
    "concept-nutrient-absorption",
    "concept-digestive-health",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Digestion happens inside the body and cannot be observed directly. A stationary VR cutaway makes the hidden pathway, organ relationships, muscle waves, churning, and absorption spatially visible.",
  learningObjective:
    "Students will identify the main digestive organs, sequence the journey of food, explain each organ function, and choose habits that support healthy digestion.",
  scientificConceptExplanation:
    "Digestion begins in the mouth, continues through the esophagus and stomach, and is completed in the small intestine where nutrients enter the blood. The large intestine absorbs water before waste is stored in the rectum and removed through the anus.",
  misconceptionsAddressed: [
    "Digestion begins in the stomach.",
    "Food passes through the liver and pancreas.",
    "The large intestine absorbs most nutrients.",
    "The gallbladder produces bile.",
  ],
  visualizationStrategy:
    "Use a child-friendly translucent torso with a glowing food pathway, animated peristalsis and churning, enlarged villi, nutrient particles, water droplets, and clearly separated supporting organs.",
  interactionStrategy:
    "Students place food in the mouth, trigger esophagus waves, turn a stomach mixer, inspect helper organs, transfer nutrients and water, sort healthy habits, and answer a five-question recap.",
  imaginationHelperStrategy:
    "Hidden muscle movement, digestive juices, nutrients, and absorbed water are enlarged and color-coded so students can connect invisible processes to each organ.",
  practicalUseCase:
    "Connects body-system knowledge to chewing, hydration, varied foods, exercise, hand washing, and everyday digestive health.",
  cueCardIds: [
    "cue-digestion-mouth-001",
    "cue-digestion-peristalsis-002",
    "cue-digestion-stomach-003",
    "cue-digestion-absorption-004",
    "cue-digestion-health-005",
  ],
  revisionCardIds: ["rev-digestive-pathway-001"],
  assessmentHookIds: [
    "assess-digestive-pre-001",
    "assess-digestive-post-001",
    "assess-digestive-misconception-001",
  ],
  instructorScript: digestiveSystemScript,
  batchActivityPrompt:
    "Draw the food pathway in order, add the three supporting organs beside it, and explain where nutrients and water enter the body.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary or seated play with no forced camera movement.",
    "Use a simple non-graphic cutaway for waste storage and removal.",
  ],
  offlineContentPackId: "pack-evs-digestive-system-class5-v1",
  estimatedPackageSizeMb: 180,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 10,
  status: "released",
};

export const BREATHING_PROCESS_MODULE: SimulationModuleRecord = {
  id: "sim-c07-ch10-a02-the-breathing-process-in-human",
  slug: "c7-ch10-a02-the-breathing-process-in-human",
  viewerKey: "breathing-process",
  legacyAliases: [],
  title: "The Breathing Process in Human",
  summary:
    "Trace the airway, locate the lungs and diaphragm, trigger an inhale and an exhale, zoom into the alveoli, and compare the two phases of the breathing cycle.",
  gradeBands: ["class6To8"],
  subjects: ["biology"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c7-ch10-breathing-process"],
  conceptIds: [
    "concept-respiratory-system",
    "concept-breathing-mechanics",
    "concept-gas-exchange",
  ],
  simulationFormat: "interactive3d",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "The diaphragm and rib cage move together inside the chest where they cannot be directly observed. A stationary VR cutaway makes that hidden, simultaneous motion spatially clear from any angle.",
  learningObjective:
    "Students will trace the airway, identify the lungs and diaphragm, explain how diaphragm and rib cage movement changes chest volume during inhalation and exhalation, and describe gas exchange at the alveoli.",
  scientificConceptExplanation:
    "Breathing is driven by the diaphragm and rib muscles. On inhalation the diaphragm contracts and flattens while the rib cage lifts, increasing chest volume and drawing air in. On exhalation the diaphragm relaxes and domes upward while the rib cage falls, decreasing chest volume and pushing air out. Gas exchange happens at the alveoli, tiny air sacs where oxygen enters the blood and carbon dioxide leaves it.",
  misconceptionsAddressed: [
    "The lungs actively pull themselves open to breathe in.",
    "Breathing in and breathing out use the same muscle motion.",
    "Gas exchange happens in the bronchi rather than the alveoli.",
  ],
  visualizationStrategy:
    "Use a labelled, color-coded chest cutaway with a diaphragm that visibly flattens and drops on inhale and domes upward on exhale, a rib cage that lifts and expands in sync, and an enlarged alveoli cluster with capillary wrapping for the gas-exchange close-up.",
  interactionStrategy:
    "Students inspect the airway, lungs, and diaphragm, pull a control to trigger inhalation, release it to trigger exhalation, zoom into an enlarged alveoli cutaway, and review a comparison board contrasting the two phases.",
  imaginationHelperStrategy:
    "The diaphragm and rib cage animate together in real time so the normally invisible, simultaneous chest-volume change becomes something students can watch happen on demand.",
  practicalUseCase:
    "Connects directly to noticing one’s own breathing rate, understanding why deep breathing feels different from shallow breathing, and recognising breathlessness after exercise.",
  cueCardIds: [
    "cue-breathing-airway-001",
    "cue-breathing-lungs-diaphragm-002",
    "cue-breathing-inhale-003",
    "cue-breathing-exhale-004",
    "cue-breathing-alveoli-005",
  ],
  revisionCardIds: ["rev-breathing-cycle-001"],
  assessmentHookIds: [
    "assess-breathing-pre-001",
    "assess-breathing-post-001",
    "assess-breathing-misconception-001",
  ],
  instructorScript: breathingProcessScript,
  batchActivityPrompt:
    "Draw the rib cage and diaphragm in the inhale position and again in the exhale position, labelling what changes shape or moves in each.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary or seated play with no forced camera movement.",
    "Encourage students to breathe normally rather than mimicking the pace of the animation.",
  ],
  offlineContentPackId: "pack-biology-breathing-process-class7-v1",
  estimatedPackageSizeMb: 140,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 6,
  status: "released",
};

export const FORCE_MOTION_MODULE: SimulationModuleRecord = {
  id: "sim-c08-ch10-a02-the-effects-of-force-on-object-s-motion-and-shape",
  slug: "c8-ch10-a02-the-effects-of-force-on-object-s-motion-and-shape",
  viewerKey: "force-motion",
  legacyAliases: [],
  title: "The Effects of Force on an Object's Motion and Shape",
  summary:
    "Push a resting ball into motion, brake it to a stop, speed it up, redirect it sideways, then squeeze and release a second ball to see force change shape.",
  gradeBands: ["class6To8"],
  subjects: ["physics"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c8-ch10-force-and-pressure"],
  conceptIds: ["concept-force-and-motion", "concept-force-and-shape"],
  simulationFormat: "interactive3d",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Seeing the same ball respond differently to five distinct forces, back to back, makes the cause-and-effect relationship between a force and its outcome far clearer than five separate static diagrams.",
  learningObjective:
    "Students will identify that a force can start, stop, speed up, or change the direction of a moving object, and that a force can change an object's shape, distinguishing elastic from non-elastic deformation.",
  scientificConceptExplanation:
    "A force is a push or a pull. An object at rest stays at rest, and an object in motion keeps moving in a straight line at constant speed, until a force acts on it (inertia). A push gives a resting object velocity that then persists on its own; a force opposing motion (a brake) slows it to rest; a further push in the direction of travel increases its speed; a force at an angle changes its direction. A force can also change an object's shape — elastically, if it springs back once the force is removed.",
  misconceptionsAddressed: [
    "A moving object needs a continuous force to keep moving.",
    "Only touching an object can apply a force to it.",
    "Any shape change caused by force is permanent.",
  ],
  visualizationStrategy:
    'A ball rolls inside a bounded arena under a real velocity model: it keeps its velocity with no drag, so after one push it visibly keeps rolling and only turns when it bounces off a wall — directly countering the "motion needs continuous force" misconception. A yellow arrow rising from the ball scales with speed and swings with direction, making velocity a visible quantity. A separate squeezable ball between two plates covers the shape-change effect.',
  interactionStrategy:
    "Students apply each force in turn — push (starts persistent motion), brake (an opposing force that decelerates over time, not an instant stop), a stronger push (speeds up), a sideways push (curves the path), then squeeze and release — watching the velocity arrow respond before reviewing a comparison board.",
  imaginationHelperStrategy:
    "Velocity — normally invisible — is drawn as an arrow that grows, shrinks, and rotates with the ball's motion, and the ball's persistence after a push makes inertia something the learner can see rather than be told.",
  practicalUseCase:
    "Connects directly to everyday pushes and pulls: kicking a ball, braking a bicycle, throwing harder, redirecting a rolling object, and squeezing a stress ball or sponge.",
  cueCardIds: [
    "cue-force-push-001",
    "cue-force-brake-002",
    "cue-force-accelerate-003",
    "cue-force-deflect-004",
    "cue-force-shape-005",
  ],
  revisionCardIds: ["rev-force-effects-001"],
  assessmentHookIds: [
    "assess-force-pre-001",
    "assess-force-post-001",
    "assess-force-misconception-001",
  ],
  instructorScript: forceMotionScript,
  batchActivityPrompt:
    "List the five effects of force you observed, and for each one, name a real push or pull from your own day that caused the same effect.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary or seated play with no forced camera movement.",
  ],
  offlineContentPackId: "pack-physics-force-motion-class8-v1",
  estimatedPackageSizeMb: 130,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 6,
  status: "released",
};

export const PLOUGHING_PREPARATION_MODULE: SimulationModuleRecord = {
  id: "sim-c08-ch01-a01-ploughing-preparation-of-soil",
  slug: "c8-ch01-a01-ploughing-preparation-of-soil",
  viewerKey: "ploughing-preparation",
  legacyAliases: [],
  title: "Ploughing: Preparation of Soil",
  summary:
    "Prepare an Indian farm for sowing by inspecting hard soil, guiding a bullock-drawn plough, comparing a tractor cultivator, breaking clods and levelling the field.",
  gradeBands: ["class6To8"],
  subjects: ["environmentalScience"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c8-ch01-crop-production-ploughing"],
  conceptIds: [
    "concept-soil-preparation",
    "concept-ploughing",
    "concept-soil-aeration",
    "concept-field-levelling",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "VR lets learners inspect field-scale traditional and modern implements, then move underground to connect ploughing with root growth, aeration, soil organisms and nutrient mixing.",
  learningObjective:
    "Students will explain ploughing as loosening and turning soil, identify why it supports crop growth, and compare traditional ploughing with a tractor-drawn cultivator.",
  scientificConceptExplanation:
    "Ploughing loosens and turns compact topsoil before sowing. The resulting pore spaces improve aeration and water movement, let roots penetrate more easily, help mix manure and nutrients, and support useful soil organisms. Breaking clods and levelling then prepare an even seedbed.",
  misconceptionsAddressed: [
    "Seeds grow equally well when placed directly in hard, compact soil.",
    "Ploughing is only for making straight lines in a field.",
    "A tractor changes the purpose of ploughing rather than mainly changing its speed and scale.",
  ],
  visualizationStrategy:
    "Use photorealistic Indian farm panoramas with close interactive models, visible furrow formation and an underground soil cutaway showing roots, pore spaces, earthworms and mixed nutrients.",
  interactionStrategy:
    "Students inspect evidence, make a hard-soil decision, complete three plough passes, compare implements, investigate underground effects, break clods, level the field and finish a four-question assessment.",
  imaginationHelperStrategy:
    "Normally hidden pore spaces, roots, organisms and nutrient mixing are enlarged in a labelled underground cutaway.",
  practicalUseCase:
    "Connects textbook soil preparation to crop establishment, irrigation, manure application and real traditional and mechanised farming practices.",
  cueCardIds: [
    "cue-ploughing-field-001",
    "cue-ploughing-hard-soil-002",
    "cue-ploughing-tool-003",
    "cue-ploughing-furrow-004",
    "cue-ploughing-modern-005",
    "cue-ploughing-underground-006",
    "cue-ploughing-levelling-007",
    "cue-ploughing-ready-008",
  ],
  revisionCardIds: ["rev-ploughing-sequence-001"],
  assessmentHookIds: [
    "assess-ploughing-observation-001",
    "assess-ploughing-misconception-001",
    "assess-ploughing-transfer-001",
  ],
  instructorScript: ploughingPreparationScript,
  batchActivityPrompt:
    "Arrange hard soil, ploughed soil and levelled soil in order, then explain how each preparation step helps the next crop.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use seated or stationary play and the bounded virtual movement area.",
    "The simulation teaches farm processes; students must not approach working animals or machinery without trained adult supervision.",
  ],
  offlineContentPackId: "pack-science-crop-production-class8-v1",
  estimatedPackageSizeMb: 8,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 8,
  status: "released",
};

export const SOWING_SEEDS_MODULE: SimulationModuleRecord = {
  id: "sim-c08-ch01-a02-sowing-of-seeds",
  slug: "c8-ch01-a02-sowing-of-seeds",
  viewerKey: "sowing-seeds",
  legacyAliases: [],
  title: "Sowing of Seeds",
  summary:
    "Continue the farm mission by selecting healthy seeds, observing a water test, setting suitable depth and spacing, comparing sowing tools and watching germination begin.",
  gradeBands: ["class6To8"],
  subjects: ["environmentalScience"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c8-ch01-crop-production-sowing"],
  conceptIds: [
    "concept-sowing",
    "concept-seed-quality",
    "concept-sowing-depth",
    "concept-seed-spacing",
    "concept-seed-drill",
    "concept-seed-germination",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "VR lets learners handle visible seed samples, compare depth and spacing at field scale, inspect sowing implements and enter an underground cutaway where root and shoot growth are normally hidden.",
  learningObjective:
    "Students will define sowing, select healthy seed, explain suitable depth and spacing, compare traditional sowing with a seed drill, and identify the first stages of germination.",
  scientificConceptExplanation:
    "Sowing places selected seeds in prepared soil. Seed quality, suitable depth and even spacing improve the chance that seedlings receive moisture, air, light, nutrients and room to establish. Seed drills can meter and cover seeds uniformly. Germination begins when a viable seed receives suitable water, oxygen and temperature.",
  misconceptionsAddressed: [
    "Any seed in a bag is equally suitable for sowing.",
    "Seeds grow best when left on the surface or buried as deeply as possible.",
    "Crowding more seeds into one place always produces more crop.",
    "Every floating seed is dead and every sinking seed is guaranteed to germinate.",
  ],
  visualizationStrategy:
    "Use a realistic Indian seedbed, tactile seed-sorting table, transparent water cylinder, soil-depth and spacing cutaways, field-scale sowing tools and an enlarged underground germination sequence.",
  interactionStrategy:
    "Students inspect the prepared field, select five healthy seeds, run the float-and-sink observation, choose suitable depth, repair a crowded row, compare implements and pass a five-question crop check.",
  imaginationHelperStrategy:
    "Seed embryos, soil depth, root emergence and shoot growth are enlarged and animated so students can connect a small seed to the developing plant.",
  practicalUseCase:
    "Connects textbook crop-production steps to kitchen gardens, school gardens and real decisions farmers make about seed lots, row placement and sowing equipment.",
  cueCardIds: [
    "cue-sowing-prepared-001",
    "cue-sowing-meaning-002",
    "cue-sowing-selection-003",
    "cue-sowing-water-test-004",
    "cue-sowing-depth-005",
    "cue-sowing-spacing-006",
    "cue-sowing-methods-007",
    "cue-sowing-germination-008",
  ],
  revisionCardIds: ["rev-sowing-sequence-001"],
  assessmentHookIds: [
    "assess-sowing-observation-001",
    "assess-sowing-misconception-001",
    "assess-sowing-transfer-001",
  ],
  instructorScript: sowingSeedsScript,
  batchActivityPrompt:
    "Design one healthy crop row: identify the seed you would choose, mark suitable depth and spacing, name the sowing tool and explain what the seed needs to germinate.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use seated or stationary play and the bounded virtual movement area.",
    "The simulation models seed handling and farm equipment; real seed treatments and moving machinery require trained adult supervision.",
  ],
  offlineContentPackId: "pack-science-crop-production-class8-v1",
  estimatedPackageSizeMb: 8,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 8,
  status: "released",
};

export const AMOEBA_NUTRITION_MODULE: SimulationModuleRecord = {
  id: "sim-c07-ch02-a02-nutrition-in-amoeba",
  slug: "c7-ch02-a02-nutrition-in-amoeba",
  viewerKey: "amoeba-nutrition",
  legacyAliases: [],
  title: "Nutrition in Amoeba",
  summary:
    "Collect pond water, enter a microscope world, explore a living amoeba and guide food through ingestion, digestion, absorption, assimilation and egestion.",
  gradeBands: ["class6To8"],
  subjects: ["biology"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c7-ch02-amoeba-nutrition"],
  conceptIds: [
    "concept-amoeba-cell",
    "concept-pseudopodia",
    "concept-food-vacuole",
    "concept-holozoic-nutrition",
    "concept-amoeba-nutrition-cycle",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "VR enlarges a normally invisible one-celled organism and lets learners move around and inside it while each nutrition process unfolds spatially in the correct order.",
  learningObjective:
    "Students will identify the main structures of an amoeba and explain the ordered stages of holozoic nutrition: ingestion, digestion, absorption, assimilation and egestion.",
  scientificConceptExplanation:
    "An amoeba is a unicellular organism with no fixed shape. Temporary projections called pseudopodia help it move and surround food. The enclosed food forms a food vacuole, where digestive juices break it into soluble substances. Nutrients pass into the cytoplasm, are used for energy, growth and repair, and undigested material is released through the cell membrane.",
  misconceptionsAddressed: [
    "An amoeba is a tiny many-celled animal with a mouth and stomach.",
    "Pseudopodia are permanent legs.",
    "Absorption and assimilation mean the same step.",
    "Egestion and excretion are identical processes.",
  ],
  visualizationStrategy:
    "Begin beside a realistic pond and microscope, then transition to a glowing microscopic environment with a translucent, continuously changing amoeba. Make the membrane, cytoplasm, nucleus, food vacuole, pseudopodia, digestive enzymes, nutrients and waste visible at an enlarged scale.",
  interactionStrategy:
    "Students collect and mount a pond sample, locate the shape-changing organism, inspect five cell structures, guide pseudopodia around food, activate digestion, distribute nutrients to three uses, release waste, order the five nutrition stages and complete an evidence-based quiz.",
  imaginationHelperStrategy:
    "The learner shrinks into a water drop, where microscopic cell parts and invisible nutrient movement become room-sized, animated and directly inspectable.",
  practicalUseCase:
    "Connects microscope observations and cell diagrams to the wider idea that even one cell must obtain food, digest it, use nutrients and remove undigested material.",
  cueCardIds: [
    "cue-amoeba-pond-001",
    "cue-amoeba-find-002",
    "cue-amoeba-anatomy-003",
    "cue-amoeba-hungry-004",
    "cue-amoeba-ingestion-005",
    "cue-amoeba-digestion-006",
    "cue-amoeba-assimilation-007",
    "cue-amoeba-egestion-008",
    "cue-amoeba-sequence-009",
    "cue-amoeba-recap-010",
  ],
  revisionCardIds: ["rev-amoeba-nutrition-cycle-001"],
  assessmentHookIds: [
    "assess-amoeba-structure-001",
    "assess-amoeba-sequence-001",
    "assess-amoeba-misconception-001",
  ],
  instructorScript: amoebaNutritionScript,
  batchActivityPrompt:
    "Draw one amoeba capturing food, label pseudopodia and the food vacuole, then arrange ingestion, digestion, absorption, assimilation and egestion in order.",
  expectedDurationMinutes: 8,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use seated or stationary play with optional bounded joystick movement.",
    "The shrinking transition is a gentle visual fade with no forced camera acceleration.",
    "Real pond water must only be handled under teacher supervision and never tasted or touched to the face.",
  ],
  offlineContentPackId: "pack-biology-amoeba-nutrition-class7-v1",
  estimatedPackageSizeMb: 9,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 10,
  status: "released",
};

export const WOOL_PROCESSING_MODULE: SimulationModuleRecord = {
  id: "sim-c07-ch03-a01-shearing-and-scouring-of-wool",
  slug: "c7-ch03-a01-shearing-and-scouring-of-wool",
  viewerKey: "wool-processing",
  legacyAliases: ["mission-wool-shearing-scouring"],
  title: "Shearing and Scouring of Wool",
  summary:
    "Join Woolly and Dr Asha in Flock Valley to choose a safe shearing season, remove the fleece carefully, investigate raw-wool impurities and operate a complete scouring station.",
  gradeBands: ["class6To8"],
  subjects: ["science"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c7-ch03-wool-processing"],
  conceptIds: [
    "concept-sheep-fleece",
    "concept-wool-shearing",
    "concept-raw-wool-impurities",
    "concept-wool-scouring",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Stationary VR lets learners walk around a life-sized sheep, practise safe tool and season decisions, inspect normally tiny fibre contamination, and operate a spatial washing line without exposing an animal or learner to real blades, machinery or hot water.",
  learningObjective:
    "Students will distinguish shearing from scouring, explain why sheep are generally sheared in warm weather, identify common impurities in raw fleece, and sequence safe washing, rinsing and drying of wool.",
  scientificConceptExplanation:
    "A sheep's fleece is its thick hair coat. Shearing carefully removes that fleece, usually in warm weather so the sheep remains comfortable and the coat can regrow before winter. Raw fleece contains dust, sweat, plant material and protective grease called lanolin. Scouring uses controlled warm water and a suitable cleaning solution to remove these impurities; gentle rinsing, squeezing and drying avoid matting the fibres.",
  misconceptionsAddressed: [
    "Shearing and scouring are two names for the same process.",
    "A sheep can be safely sheared in any season with any sharp cutting tool.",
    "Plain cold water removes all grease from raw wool.",
    "Very hot water and rough twisting clean wool better without affecting the fibres.",
  ],
  visualizationStrategy:
    "Use a populated mountain farm, a recognisable sheep with layered fleece, a clean shearing station, magnified impurities, transparent comparison vessels, animated dirt and grease separation, two rinse tanks, squeeze rollers, a drying rack and a before-after fibre comparison.",
  interactionStrategy:
    "Students inspect Woolly, solve a season challenge, prepare safe equipment in order, complete four controlled shearing paths, locate four impurities, compare washing conditions, operate seven scouring steps, compare raw and clean samples, build the process timeline and answer a four-question evidence check.",
  imaginationHelperStrategy:
    "Invisible sweat and lanolin become glowing fibre-level clues, while transparent tanks make grease, dirt, rinse water and fibre tangling visible at classroom scale.",
  practicalUseCase:
    "Connects woollen clothing to animal care, farm work and industrial fibre cleaning while reinforcing safe equipment choice and controlled processing conditions.",
  cueCardIds: [
    "cue-wool-arrival-001",
    "cue-wool-season-002",
    "cue-wool-prepare-003",
    "cue-wool-shearing-004",
    "cue-wool-detective-005",
    "cue-wool-experiment-006",
    "cue-wool-station-007",
    "cue-wool-compare-008",
    "cue-wool-journey-009",
    "cue-wool-quiz-010",
  ],
  revisionCardIds: ["rev-wool-shearing-scouring-sequence-001"],
  assessmentHookIds: [
    "assess-wool-season-001",
    "assess-wool-process-001",
    "assess-wool-safety-001",
  ],
  instructorScript: woolProcessingScript,
  batchActivityPrompt:
    "In pairs, order sheep, shearing, raw fleece, scouring, rinsing and drying; then explain one animal-care decision and one fibre-care decision.",
  expectedDurationMinutes: 7,
  maxSessionDurationMinutes: 9,
  comfortRiskLevel: "low",
  safetyNotes: [
    "This is a stationary simulation; use the bounded movement area and keep the real play space clear.",
    "Real shearing must only be performed by trained adults using maintained equipment and humane animal-handling practice.",
    "Hot water, cleaning chemicals, blades and powered rollers require trained adult supervision in real settings.",
  ],
  offlineContentPackId: "pack-science-wool-processing-class7-v1",
  estimatedPackageSizeMb: 12,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 10,
  status: "released",
};

const acidBaseScript = `SETUP
Ask students how they could tell an acid from a base without tasting or touching it. Non-headset students list household acids and bases and predict litmus colours.

DURING HEADSET BATCH
Guide students to dip litmus in an acid, then a base, add a universal indicator to read pH from colour, then add base to the acid drop by drop until it neutralises at pH 7. Pause at neutralisation to name the products (a salt and water).

DEBRIEF
Ask students to state the litmus rule (blue reddens in acid, red blues in base) and explain what neutralisation produces and why the pH reaches 7.

REVISION TRIGGER
One week later, show three unlabelled indicator colours and ask students to give the approximate pH and whether each is an acid, a base, or neutral.`;

const colourAdventureScript = `SETUP
Ask students to point to one red, blue, yellow, and green object in the classroom. Non-headset students prepare a ten-colour picture hunt.

DURING HEADSET BATCH
Guide students into the magical colour classroom, then introduce one colour world at a time. Ask them to touch each colour balloon, name the colour aloud, find matching objects, and complete the memory game.

DEBRIEF
Review red, blue, yellow, green, orange, purple, pink, brown, black, and white. Ask students to name one familiar object for each colour and explain that an object's colour can help us describe and identify it.

REVISION TRIGGER
One week later, show a mixed set of classroom objects and ask students to sort or name them by colour without using the headset.`;

export const ACID_BASE_MODULE: SimulationModuleRecord = {
  id: "sim-c10-ch02-a01-introduction-to-acids-and-bases-and-litmus-test",
  slug: "c10-ch02-a01-introduction-to-acids-and-bases-and-litmus-test",
  viewerKey: "acid-base",
  legacyAliases: [],
  title: "Acids, Bases & Neutralisation",
  summary:
    "Identify an acid and a base with litmus, read pH from a universal indicator, and neutralise an acid with a base to form a salt and water.",
  gradeBands: ["class9To10"],
  subjects: ["chemistry"],
  applicableBoards: ["cbse", "icse"],
  curriculumMapIds: ["cm-cbse-c10-ch02-acids-bases-salts"],
  conceptIds: [
    "concept-acids-bases",
    "concept-ph-indicators",
    "concept-neutralisation",
  ],
  simulationFormat: "practicalLabSimulation",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "pH is invisible, and colour changes are fast and easy to miss on a classroom bench. A stationary VR lab lets students repeat litmus dips and titrate a neutralisation while a live pH scale makes the hidden quantity readable.",
  learningObjective:
    "Students will identify acids and bases using litmus, relate universal-indicator colour to pH, and explain that adding a base to an acid neutralises it to form a salt and water at pH 7.",
  scientificConceptExplanation:
    "Acids turn blue litmus red and have a pH below 7; bases turn red litmus blue and have a pH above 7. A universal indicator shows a colour that maps to the exact pH, red through green (neutral) to violet. Adding a base to an acid neutralises it: the pH rises toward 7 and the products are a salt and water.",
  misconceptionsAddressed: [
    "A stronger acid has a higher pH.",
    "Neutral means nothing happened, rather than acid and base cancelling to pH 7.",
    "Litmus and universal indicator are the same test.",
  ],
  visualizationStrategy:
    "A beaker whose solution colour is driven by a real pH model (universal-indicator colour = f(pH)), litmus strips that redden or blue by the same model, and a segmented pH scale with a live marker that moves as base is added.",
  interactionStrategy:
    "Students dip litmus into an acid then a base, add a universal indicator to read the pH colour, add base drop by drop to titrate the acid to pH 7, and compare acidic, neutral, and basic solutions on the scale.",
  imaginationHelperStrategy:
    "pH — invisible on a real bench — is shown twice over: as the solution and litmus colours, and as a moving marker on a colour-coded pH scale, so the abstract number becomes something students watch change.",
  practicalUseCase:
    "Connects to reading household product labels, antacids relieving acidity, and why soil pH matters for plants.",
  cueCardIds: [
    "cue-acidbase-litmus-001",
    "cue-acidbase-base-002",
    "cue-acidbase-indicator-003",
    "cue-acidbase-neutralise-004",
    "cue-acidbase-compare-005",
  ],
  revisionCardIds: ["rev-acidbase-ph-001"],
  assessmentHookIds: [
    "assess-acidbase-pre-001",
    "assess-acidbase-post-001",
    "assess-acidbase-misconception-001",
  ],
  instructorScript: acidBaseScript,
  batchActivityPrompt:
    "Draw the pH scale from 0 to 14, mark where the acid, the neutral product, and the base sit, and write the litmus colour rule beside it.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary or seated play with no forced camera movement.",
    "Reinforce that real acids and bases are handled only with teacher supervision and safety gear.",
  ],
  offlineContentPackId: "pack-chemistry-acids-bases-class10-v1",
  estimatedPackageSizeMb: 135,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 5,
  status: "released",
};

export const COLOUR_ADVENTURE_MODULE: SimulationModuleRecord = {
  id: "sim-c1-art-a01-learning-of-colours",
  slug: "c1-art-a01-learning-of-colours",
  viewerKey: "colour-adventure",
  legacyAliases: [],
  title: "Colour Adventure",
  summary:
    "Visit ten magical colour worlds, find matching objects, and complete a friendly colour-memory game.",
  gradeBands: ["class1To2"],
  subjects: ["art"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c1-art-colours"],
  conceptIds: ["concept-colour-names", "concept-colour-object-matching"],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Young learners benefit from naming colours while directly touching large, high-contrast objects in playful worlds that provide immediate visual and spoken feedback.",
  learningObjective:
    "Students will identify, name, and match ten common colours to familiar objects in their surroundings.",
  scientificConceptExplanation:
    "Colour words describe a visible property of objects. Matching a colour name to repeated visual examples helps young learners recognise, compare, sort, and communicate what they see.",
  misconceptionsAddressed: [
    "A colour name belongs to only one object.",
    "Black and white are not useful colour descriptions.",
    "Similar-looking colours do not need different names.",
  ],
  visualizationStrategy:
    "Use one high-contrast colour world at a time with oversized familiar objects, matching balloons, rainbow transitions, and calm celebratory feedback.",
  interactionStrategy:
    "Students touch colour balloons, find ten requested colours, answer object-colour memory questions, and collect a final Colour Explorer star.",
  imaginationHelperStrategy:
    "Each colour transforms the whole classroom so the word, balloon, and several familiar objects share one clear visual property.",
  practicalUseCase:
    "Supports describing classroom objects, sorting art materials, following instructions, and noticing colours in daily surroundings.",
  cueCardIds: [
    "cue-colour-primary-001",
    "cue-colour-nature-002",
    "cue-colour-objects-003",
  ],
  revisionCardIds: ["rev-colour-object-hunt-001"],
  assessmentHookIds: ["assess-colour-match-001", "assess-colour-transfer-001"],
  instructorScript: colourAdventureScript,
  batchActivityPrompt:
    "Find or draw one object for each of the ten colours, then name the colours aloud with a partner.",
  expectedDurationMinutes: 9,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary classroom mode.",
    "Keep every target large, slow, and within comfortable reach for Class 1 learners.",
  ],
  offlineContentPackId: "pack-art-colours-class1-v1",
  estimatedPackageSizeMb: 150,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 14,
  status: "released",
};

export const MONEY_TOWN_MODULE: SimulationModuleRecord = {
  id: "sim-c1-math-ch01-introduction-to-money",
  slug: "c1-math-ch01-introduction-to-money",
  viewerKey: "money-town",
  legacyAliases: [],
  title: "Introduction to Money",
  summary:
    "Explore Magic Money Town, identify Indian coins and notes, buy simple items, and earn a careful shopper badge.",
  gradeBands: ["class1To2"],
  subjects: ["mathematics"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c1-math-money"],
  conceptIds: [
    "concept-money-values",
    "concept-indian-coins-notes",
    "concept-simple-shopping",
  ],
  simulationFormat: "interactive3d",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Young learners understand money better when they can pick up, compare, and use coins and notes in a safe pretend shop instead of only seeing flat textbook pictures.",
  learningObjective:
    "Students will identify common Indian coins and notes, compare their values, and choose suitable money for simple purchases.",
  scientificConceptExplanation:
    "Money is a standard medium of exchange. Coins and notes carry values that can be counted, compared, combined, and exchanged for goods in everyday transactions.",
  misconceptionsAddressed: [
    "All coins have the same value.",
    "A bigger note picture always means a larger physical size.",
    "Buying does not require matching price and value.",
  ],
  visualizationStrategy:
    "Use a colourful town market with oversized coins, notes, price tags, shop counters, and reward feedback that makes value comparison visible.",
  interactionStrategy:
    "Students inspect money tokens, sort coins and notes, match values, buy items, and complete a memory check through large Quest-friendly targets.",
  imaginationHelperStrategy:
    "Abstract value is represented with glowing number labels, item price beams, and coin-note comparison trays.",
  practicalUseCase:
    "Connects classroom counting to shops, pocket money, saving, and careful everyday transactions.",
  cueCardIds: [
    "cue-money-coin-001",
    "cue-money-note-002",
    "cue-money-price-003",
    "cue-money-shopping-004",
  ],
  revisionCardIds: ["rev-money-values-001"],
  assessmentHookIds: [
    "assess-money-pre-001",
    "assess-money-post-001",
    "assess-money-misconception-001",
  ],
  instructorScript: moneyTownScript,
  batchActivityPrompt:
    "Draw two coins and two notes, write their values, and choose money for one pretend shop item.",
  expectedDurationMinutes: 9,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary shop mode.",
    "Keep all targets large, slow, and reachable for Class 1 learners.",
  ],
  offlineContentPackId: "pack-math-money-class1-v1",
  estimatedPackageSizeMb: 150,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 8,
  status: "released",
};

export const PREPOSITION_ADVENTURE_MODULE: SimulationModuleRecord = {
  id: "sim-c2-english-ch01-prepositions",
  slug: "c2-english-ch01-prepositions",
  viewerKey: "preposition-adventure",
  legacyAliases: [],
  title: "Preposition Adventure",
  summary:
    "Move objects through a playful world and learn position words such as in, on, under, behind, near, and between.",
  gradeBands: ["class1To2"],
  subjects: ["english"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c2-english-prepositions"],
  conceptIds: [
    "concept-position-words",
    "concept-spatial-sentences",
    "concept-preposition-use",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "Prepositions describe spatial relationships, so students benefit from seeing and changing object positions directly instead of only memorizing word lists.",
  learningObjective:
    "Students will understand common prepositions by placing objects in correct positions and speaking simple sentences that describe location.",
  scientificConceptExplanation:
    "Prepositions are words that show relationships between nouns or pronouns and other words, often describing position, direction, or place.",
  misconceptionsAddressed: [
    "In and on can be used for the same position.",
    "Under and behind mean the same thing.",
    "A preposition can be learned without noticing the object relationship.",
  ],
  visualizationStrategy:
    "Use a storybook playroom with large objects, animated position cues, friendly rewards, and clear before-after placement scenes.",
  interactionStrategy:
    "Students select an object, place it in the requested spatial relationship, hear the sentence aloud, and complete memory checks.",
  imaginationHelperStrategy:
    "Invisible grammar relationships become visible through arrows, glow zones, and object-position snapshots.",
  practicalUseCase:
    "Supports everyday classroom instructions, reading comprehension, and speaking complete location sentences.",
  cueCardIds: [
    "cue-preposition-in-001",
    "cue-preposition-on-002",
    "cue-preposition-under-003",
    "cue-preposition-between-004",
  ],
  revisionCardIds: ["rev-preposition-picture-match-001"],
  assessmentHookIds: [
    "assess-preposition-pre-001",
    "assess-preposition-post-001",
    "assess-preposition-misconception-001",
  ],
  instructorScript: prepositionAdventureScript,
  batchActivityPrompt:
    "Use a pencil and book to make three positions, then say one sentence for each preposition.",
  expectedDurationMinutes: 9,
  maxSessionDurationMinutes: 10,
  comfortRiskLevel: "low",
  safetyNotes: [
    "Use stationary playroom mode.",
    "Avoid fast object movement and keep all placement zones close to the learner.",
  ],
  offlineContentPackId: "pack-english-prepositions-class2-v1",
  estimatedPackageSizeMb: 160,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 5,
  status: "released",
};

export const SOLAR_SYSTEM_MISSION_MODULE: SimulationModuleRecord = {
  id: "sim-c8-10-science-solar-system",
  slug: "c8-10-science-solar-system",
  viewerKey: "solar-system-mission",
  legacyAliases: [],
  title: "Solar System: Gravity’s Orchestra",
  summary:
    "Explore a live orbiting solar system: make the Sun’s gravity visible, race the planets, probe the hottest world, stretch space to true scale, and ride a comet.",
  gradeBands: ["class6To8", "class9To10"],
  subjects: ["science", "physics", "geography"],
  applicableBoards: ["cbse", "icse", "stateBoard"],
  curriculumMapIds: ["cm-cbse-c8-science-solar-system"],
  conceptIds: [
    "concept-solar-system",
    "concept-planet-order",
    "concept-orbits-gravity",
    "concept-planet-features",
  ],
  simulationFormat: "immersiveVr",
  evidenceConfidenceLevel: "expertDesigned",
  releaseMaturity: "internalQA",
  publicationStatus: "released",
  evidenceMaturity: "internalQA",
  xrFitType: "strongVrFit",
  xrFitJustification:
    "The solar system is too large, distant, and dynamic to experience in a classroom. VR lets students watch real orbital motion, test predictions against measurements, and feel the emptiness of true scale.",
  learningObjective:
    "Students will explain how the Sun’s gravity sets each planet’s speed and year, why Venus outheats Mercury, how empty true-scale space is, and why a comet’s tail points away from the Sun.",
  scientificConceptExplanation:
    "The Sun’s gravity weakens with distance, so closer planets orbit faster (Kepler’s laws). Venus’s CO₂ atmosphere traps heat, making it hotter than Mercury. Distances between planets dwarf the planets themselves, and radiation pressure with solar wind pushes comet tails away from the Sun.",
  misconceptionsAddressed: [
    "All planets take about the same time to orbit the Sun.",
    "Mercury must be the hottest planet because it is closest to the Sun.",
    "The planets are spaced as closely as textbook diagrams show.",
    "A comet’s tail trails behind it like smoke from a train.",
  ],
  visualizationStrategy:
    "One persistent orbiting solar system driven by real periods: a gravity-lens arrow field makes the Sun’s pull visible, lap boards score the orbit race, infrared readouts confront the heat prediction, and a lever blends the world to honest distances.",
  interactionStrategy:
    "Students predict before every observation: lock a race winner then confirm from the lap board, probe Mercury and Venus, inspect each giant’s signature feature, find Earth at true scale, predict a comet tail then ride the pass, and transfer Kepler’s law to a new probe.",
  imaginationHelperStrategy:
    "Invisible gravity becomes an arrow field that weakens with distance, orbital speed becomes visible velocity vectors and lap counters, and declared scale compression is confronted head-on by the true-scale lever.",
  practicalUseCase:
    "Connects astronomy lessons to night-sky observation, seasons, space missions, satellites, and scientific modelling.",
  cueCardIds: [
    "cue-solar-sun-001",
    "cue-solar-rocky-002",
    "cue-solar-gas-giants-003",
    "cue-solar-orbits-004",
  ],
  revisionCardIds: ["rev-solar-planet-order-001"],
  assessmentHookIds: [
    "assess-solar-pre-001",
    "assess-solar-post-001",
    "assess-solar-misconception-001",
  ],
  instructorScript: solarSystemMissionScript,
  batchActivityPrompt:
    "Write predictions for the hottest planet and the race winner on a planet-order strip, then record the headset students’ evidence and whether each prediction survived.",
  expectedDurationMinutes: 10,
  maxSessionDurationMinutes: 12,
  comfortRiskLevel: "medium",
  safetyNotes: [
    "Space topic: brief students on the camera flythroughs before headsets go on.",
    "Eased, learner-triggered transitions only; comfort stop is the Back action at any time.",
    "The true-scale stretch and comet ride are the two motion-heavy beats — remind students they can simply look away or press Back.",
  ],
  offlineContentPackId: "pack-science-solar-system-v1",
  estimatedPackageSizeMb: 280,
  targetFrameRateFps: 72,
  minQuestStorageGb: 1,
  stages: 8,
  status: "released",
};

export const SIMULATION_MODULES = [
  POLLINATION_MODULE,
  CIRCUIT_MODULE,
  STATES_OF_MATTER_MODULE,
  SOURCES_OF_FOOD_MODULE,
  SOLUBLE_INSOLUBLE_MODULE,
  DIGESTIVE_SYSTEM_MODULE,
  BREATHING_PROCESS_MODULE,
  FORCE_MOTION_MODULE,
  AMOEBA_NUTRITION_MODULE,
  PLOUGHING_PREPARATION_MODULE,
  SOWING_SEEDS_MODULE,
  ACID_BASE_MODULE,
  COLOUR_ADVENTURE_MODULE,
  MONEY_TOWN_MODULE,
  PREPOSITION_ADVENTURE_MODULE,
  SOLAR_SYSTEM_MISSION_MODULE,
] as const;
