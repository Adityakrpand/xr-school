import {
  createGuidedAssessment,
  createGuidedAssetManifest,
  createGuidedLesson,
  createGuidedModuleRecord,
  defineGuidedImplementedSimulation,
  type GuidedStageAuthoring,
} from './builders.js';

const moduleId = 'sim-c05-ch03-a01-a-sense-of-taste';
const slug = 'c5-ch03-a01-a-sense-of-taste';
const viewerKey = 'guided-sense-of-taste';

const stages = [
  {
    id: 'saliva-release-lab',
    title: 'Release the Taste Clues',
    cue: 'Activate the saliva drop and watch a virtual food crystal dissolve into tiny taste clues.',
    detail:
      'Food chemicals must dissolve in saliva before they can reach taste-receptor cells. Saliva does not create taste; it carries dissolved molecules to the receptors.',
    actionId: 'dissolve-virtual-food-sample',
    actionLabel: 'Release the saliva drop',
    evidenceId: 'saliva-dissolving-evidence',
    evidenceMode: 'scene',
    scaleNote:
      'The crystal, droplets and moving particles are enlarged teaching models. Individual dissolved food molecules cannot be seen with unaided eyes.',
    narrationText:
      'Welcome, taste detective! We will use safe virtual samples, so please never taste an unknown substance. Activate the saliva drop above the sample. Watch the crystal break into tiny clues. Chemicals from food must dissolve in saliva before they can reach taste receptors. Saliva carries the clues; it does not create the taste.',
  },
  {
    id: 'taste-bud-observatory',
    title: 'Enter a Taste Bud',
    cue: 'Scan the enlarged papilla, reveal the taste bud and compare the five basic taste qualities.',
    detail:
      'Taste buds contain receptor cells that respond to dissolved chemicals. Sweet, sour, salty, bitter and umami are five basic taste qualities, and responsive regions across the tongue can detect all five.',
    actionId: 'scan-taste-bud-receptors',
    actionLabel: 'Scan the giant taste bud',
    evidenceId: 'taste-bud-receptor-evidence',
    evidenceMode: 'scene',
    scaleNote:
      'The papilla, taste bud, receptor cells and coloured signals are greatly enlarged. The colours identify the five qualities; real taste signals are not coloured lights.',
    narrationText:
      'Now enter the taste-bud observatory. The small bumps you can see on a tongue are called papillae, and many papillae contain taste buds. Inside are receptor cells that respond to dissolved chemicals. Scan the model to reveal sweet, sour, salty, bitter and umami. All responsive parts of the tongue can detect these five qualities. A strict tongue map is a myth.',
  },
  {
    id: 'nose-flavour-connection',
    title: 'Open the Aroma Route',
    cue: 'Open the virtual aroma route and follow the particles from the mouth towards the nose.',
    detail:
      'Flavour is a combined brain experience. Basic taste signals from the tongue join smell from the nose, while texture and temperature add more information.',
    actionId: 'open-retronasal-aroma-route',
    actionLabel: 'Open the aroma route',
    evidenceId: 'smell-flavour-connection-evidence',
    evidenceMode: 'answer',
    misconceptionId: `${viewerKey}:misconception`,
    scaleNote:
      'The glowing aroma particles and transparent head model show an invisible pathway. They are an explanatory model, not a literal view inside a person.',
    narrationText:
      'Taste is only part of flavour. Open the virtual aroma route. While food is in the mouth, aroma molecules can travel behind the mouth towards smell receptors in the nose. The brain combines basic taste with smell, texture and temperature. That is why food may seem less flavourful when a blocked nose reduces smell, even though the taste buds still work.',
  },
  {
    id: 'mystery-flavour-challenge',
    title: 'Solve the Mystery Flavour',
    cue: 'Inspect the virtual tomato and combine its taste, aroma and texture clues to solve the case.',
    detail:
      'A food is recognised from several kinds of sensory evidence. A tomato can provide sour, sweet and umami taste clues, a distinctive aroma and a juicy texture.',
    actionId: 'inspect-mystery-flavour-sample',
    actionLabel: 'Inspect the mystery sample',
    evidenceId: 'combined-flavour-evidence',
    evidenceMode: 'answer',
    transferPromptId: `${viewerKey}:transfer`,
    scaleNote:
      'The floating clue symbols separate sensations that normally arrive together. Their size and colour do not represent signal strength in the body.',
    narrationText:
      'Final case! Inspect the virtual tomato. Its dissolved chemicals provide sour, sweet and umami taste clues. Its aroma reaches the nose, and its juicy texture gives touch information. Combine the evidence to identify how the brain builds flavour. In real life, taste only familiar food approved by a trusted adult, check allergies, use clean hands and utensils, and never taste a laboratory substance.',
  },
] satisfies GuidedStageAuthoring[];

const { guidance, narration } = createGuidedLesson({
  id: viewerKey,
  moduleId,
  viewerKey,
  classContext: 'CBSE Class 5 Environmental Studies',
  gradeTone: 'class3To5',
  objective:
    'Explain how saliva, taste receptors and smell contribute to taste and flavour, then use multiple sensory clues to identify a virtual food.',
  stages,
  completion: {
    eyebrow: 'Taste Detective Laboratory',
    headline: 'Flavour Case Solved',
    body: 'You released dissolved taste clues, explored a taste bud, opened the aroma route and combined taste, smell and texture evidence.',
    actionLabel: 'Review the four flavour clues',
  },
});

const assessment = createGuidedAssessment({
  id: `${viewerKey}:assessment`,
  objectiveId: guidance.id,
  misconception: {
    id: `${viewerKey}:misconception`,
    stageId: 'nose-flavour-connection',
    question: 'Why can food seem less flavourful when your nose is blocked?',
    acceptedEvidenceId: 'smell-flavour-connection-evidence',
    acceptedLabel:
      'A blocked nose reduces smell information, so the brain receives fewer aroma clues even though taste buds still detect basic tastes.',
    distractorLabel: 'A blocked nose switches off every taste bud, so the tongue detects nothing at all.',
    hint: 'Remember that flavour combines signals from more than one sense.',
    explanation:
      'The tongue can still detect basic taste qualities, but reduced smell makes the combined flavour experience less detailed.',
  },
  transfer: {
    id: `${viewerKey}:transfer`,
    stageId: 'mystery-flavour-challenge',
    question: 'Which evidence gives the most complete description of the tomato flavour?',
    acceptedEvidenceId: 'combined-flavour-evidence',
    acceptedLabel:
      'Its sweet, sour and umami taste clues combine with tomato aroma, juicy texture and temperature in the brain.',
    distractorLabel: 'Only one special point on the tongue identifies the complete tomato flavour by itself.',
    hint: 'Use the taste, aroma and texture clues together.',
    explanation:
      'Flavour is a combined perception. Taste buds provide basic taste information, while smell, texture and temperature add important evidence.',
  },
});

export const SENSE_OF_TASTE_GUIDANCE = guidance;
export const SENSE_OF_TASTE_SCENE_METADATA = Object.freeze({
  environmentUrl: `/simulations/${slug}/environment.webp`,
  stageOutcomes: Object.fromEntries(stages.map((stage) => [`scene:${stage.id}`, stage.detail])),
});

export const SENSE_OF_TASTE_SIMULATION = defineGuidedImplementedSimulation({
  module: createGuidedModuleRecord(
    {
      id: moduleId,
      title: 'From Tasting to Digesting: A Sense of Taste',
      slug,
      viewerKey,
      summary:
        'Become a taste detective in a realistic virtual sensory laboratory and discover how saliva, taste buds, smell and texture work together.',
      gradeBands: ['class3To5'],
      subjects: ['environmentalScience', 'biology'],
      curriculumMapIds: ['cm-cbse-c5-ch03-digestive-system'],
      conceptIds: [
        'concept-basic-tastes',
        'concept-taste-buds',
        'concept-flavour-and-smell',
        'concept-digestive-system',
      ],
      simulationFormat: 'immersiveVr',
      xrFitType: 'strongVrFit',
      xrFitJustification:
        'A 360-degree sensory lab lets learners move from a tabletop food sample into an enlarged taste bud and a transparent aroma pathway while keeping all movement comfortable and optional.',
      learningObjective:
        'Explain how dissolved food chemicals activate taste receptors and how the brain combines taste with smell, texture and temperature to create flavour.',
      scientificConceptExplanation:
        'Saliva dissolves chemicals from food so they can contact taste-receptor cells in taste buds. Five basic taste qualities are sweet, sour, salty, bitter and umami. Smell, including aroma travelling from the mouth towards the nose, combines with taste, texture and temperature to form flavour.',
      misconceptionsAddressed: [
        'Saliva creates the taste instead of dissolving and carrying food chemicals.',
        'Different basic tastes are detected only in separate zones on a strict tongue map.',
        'Taste and flavour mean exactly the same thing.',
        'A blocked nose switches off the taste buds completely.',
        'Spicy heat is one of the five basic tastes rather than a heat-and-pain sensation.',
      ],
      visualizationStrategy:
        'An original project-generated 360-degree Indian school sensory laboratory surrounds enlarged procedural models of saliva dissolution, papillae, taste-receptor cells, the aroma route and a multi-sensory tomato challenge.',
      interactionStrategy:
        'Learners use pointer, keyboard, centre-gaze or Quest controllers to dissolve a virtual sample, scan a giant taste bud, open an aroma route and inspect a mystery food before answering evidence-based questions.',
      practicalUseCase:
        'Connects everyday eating with the beginning of digestion, safe food habits, sensory science and evidence-based explanations of flavour.',
      cueCardIds: stages.map((stage) => `${viewerKey}:cue:${stage.id}`),
      revisionCardIds: [`${viewerKey}:revision`],
      assessmentHookIds: [`${viewerKey}:misconception`, `${viewerKey}:transfer`],
      instructorScript:
        'Run the four investigations in order. Ask learners to name what each coloured overlay represents, distinguish taste from flavour and explain why the strict tongue map is incorrect.',
      batchActivityPrompt:
        'Give groups taste, smell, texture and temperature clue cards. Ask them to build a complete flavour profile for a familiar food without tasting any unknown material.',
      expectedDurationMinutes: 5,
      maxSessionDurationMinutes: 5,
      comfortRiskLevel: 'low',
      safetyNotes: [
        'All food samples are virtual. Never taste unknown substances or anything used in a science laboratory.',
        'For real classroom tasting, obtain teacher and guardian approval, check allergies and dietary restrictions, and use clean hands and utensils.',
        'Use a stationary or bounded VR area, keep the floor clear and stop if discomfort occurs.',
      ],
      estimatedPackageSizeMb: 8,
    },
    guidance,
  ),
  guidance,
  assessment,
  narration,
  assets: createGuidedAssetManifest({
    id: `assets:${moduleId}`,
    environment: {
      id: `${moduleId}:sensory-laboratory-environment`,
      url: `/simulations/${slug}/environment.webp`,
      source: 'Project-generated 360-degree sensory laboratory panorama for the user-requested taste simulation',
      license: 'project-generated',
      author: 'XR School project team',
      width: 1774,
      height: 887,
      channels: ['baseColor'],
      compression: 'WebP lossy q80; sharp/libvips',
      byteSize: 199896,
      sha256: '4223946cede9064d198bd11c1ad4581c525b6c1721c719fb33487fa741064421',
    },
  }),
  legacyPaths: [],
  contribution: {
    source: 'user-story',
    integration: 'new-class',
    contributor: 'Aditya K. R. Pandey',
    sourcePath: 'apps/web/lib/simulations/guided/c5-ch03-a01-a-sense-of-taste.scene.ts',
  },
});
