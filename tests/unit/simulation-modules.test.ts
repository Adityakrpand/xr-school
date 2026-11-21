import { describe, it, expect } from "vitest";

/**
 * Validates the simulation module seed data against the TypeSpec contract rules.
 * These run offline — no server needed.
 */

const VALID_XR_FIT_TYPES = ["strongVrFit", "arTabletFit"];
const VALID_BOARDS = ["cbse", "icse", "stateBoard"];
const VALID_GRADE_BANDS = [
  "kindergarten",
  "class1To2",
  "class3To5",
  "class6To8",
  "class9To10",
  "class11To12",
];
const VALID_SUBJECTS = [
  "science",
  "physics",
  "chemistry",
  "biology",
  "mathematics",
  "geography",
  "history",
  "environmentalScience",
  "computerScience",
  "vocationalSkills",
  "careerExposure",
];
const VALID_STATUSES = [
  "draft",
  "approved",
  "released",
  "deprecated",
  "archived",
];
const VALID_COMFORT_RISKS = ["low", "medium", "high"];
const VALID_FORMATS = [
  "immersiveVr",
  "threeSixtyVr",
  "interactive3d",
  "guidedVisualization",
  "practicalLabSimulation",
  "virtualFieldVisit",
  "revisionMode",
];
const VALID_EVIDENCE_LEVELS = [
  "experimental",
  "expertDesigned",
  "internallyPiloted",
  "schoolValidated",
  "researchBacked",
];

// Simulation module definitions — must stay in sync with apps/api/src/index.ts
const SIMULATIONS = [
  {
    id: "sim-pollination-001",
    slug: "pollination",
    title: "Plant Pollination & Growth Cycle",
    gradeBands: ["class6To8", "class9To10"],
    subjects: ["biology", "environmentalScience"],
    applicableBoards: ["cbse", "icse"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Pollination occurs at microscopic scale and involves invisible pollen transfer that students cannot witness directly.",
    learningObjective:
      "Students will be able to sequence the 8 stages of plant reproduction from pollen production through germination.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 10,
    stages: 8,
    status: "released",
  },
  {
    id: "sim-circuit-001",
    slug: "circuit",
    title: "Electric Circuits & Resistance (Ohm's Law)",
    gradeBands: ["class9To10"],
    subjects: ["physics"],
    applicableBoards: ["cbse", "icse"],
    simulationFormat: "interactive3d",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Electric current is invisible. Visualising electron flow as glowing particles gives students a spatial, intuitive understanding.",
    learningObjective:
      "Students will apply Ohm's Law (V=IR) to predict how changing resistance affects current.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 8,
    stages: 4,
    status: "released",
  },
  {
    id: "sim-float-sink-water-001",
    slug: "float-sink-water",
    title: "What Floats, What Sinks?",
    gradeBands: ["class3To5"],
    subjects: ["science"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Learners physically conduct repeated buoyancy trials and observe the full path above, at, and below the water surface from any angle.",
    learningObjective:
      "Students will predict, test, and correctly classify familiar objects as floating or sinking, then explain the observations using average density relative to water.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 5,
    status: "approved",
  },
  {
    id: "sim-dead-sea-salt-water-001",
    slug: "dead-sea-salt-water",
    title: "Dead Sea: Salt Water & Its Effects",
    gradeBands: ["class3To5"],
    subjects: ["science"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Learners repeat a controlled egg trial while salt dissolves visibly and the egg rises as water density increases.",
    learningObjective:
      "Students will compare egg buoyancy in ordinary and sufficiently salty water and explain that dissolved salt increases water density.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 5,
    status: "approved",
  },
  {
    id: "sim-soluble-insoluble-substances-001",
    slug: "soluble-insoluble-substances",
    title: "Soluble & Insoluble: The Disappearing Mystery",
    gradeBands: ["class3To5"],
    subjects: ["science"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Learners conduct six controlled trials and compare dissolving, settling, clouding, and floating outcomes from any angle.",
    learningObjective:
      "Students will test and classify six familiar substances as soluble or insoluble and explain that dissolved matter still exists.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 5,
    status: "approved",
  },
  {
    id: "sim-synthetic-fibres-types-001",
    slug: "synthetic-fibres-types",
    title: "Synthetic Fibres: Introduction & Types",
    gradeBands: ["class6To8"],
    subjects: ["science", "chemistry"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Learners make the invisible polymer-to-fibre process visible and compare four fibres through safe, repeatable material tests.",
    learningObjective:
      "Students will explain fibre manufacture, distinguish rayon, nylon, polyester, and acrylic, and apply fire-safety guidance.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 8,
    status: "approved",
  },
  {
    id: "sim-thermoplastics-thermosetting-001",
    slug: "thermoplastics-thermosetting",
    title: "Thermoplastics & Thermosetting Plastics",
    gradeBands: ["class6To8"],
    subjects: ["science", "chemistry"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Learners safely repeat virtual heating and remoulding tests while observing chain movement and permanent cross-links inside identical samples.",
    learningObjective:
      "Students will distinguish thermoplastics from thermosetting plastics, explain cross-links, and classify common plastic objects.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 7,
    status: "approved",
  },
  {
    id: "sim-traffic-signs-road-safety-001",
    slug: "traffic-signs-road-safety",
    title: "The Smart Road Adventure",
    gradeBands: ["class3To5"],
    subjects: ["science", "environmentalScience"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Learners repeatedly practise road-sign, traffic-light, and zebra-crossing decisions inside a responsive junction without exposure to real traffic.",
    learningObjective:
      "Students will identify important signs, interpret traffic lights, and perform the complete safe zebra-crossing sequence.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 6,
    status: "approved",
  },
];

describe("Simulation module contracts", () => {
  SIMULATIONS.forEach((sim) => {
    describe(`[${sim.slug}] ${sim.title}`, () => {
      it("has a non-empty id and slug", () => {
        expect(sim.id).toBeTruthy();
        expect(sim.slug).toBeTruthy();
        expect(sim.slug).toMatch(/^[a-z0-9-]+$/);
      });

      it("has a non-empty title and learningObjective", () => {
        expect(sim.title.length).toBeGreaterThan(5);
        expect(sim.learningObjective.length).toBeGreaterThan(10);
      });

      it("has a valid xrFitType (not normalClassroomBetter or notWorthXr)", () => {
        expect(VALID_XR_FIT_TYPES).toContain(sim.xrFitType);
      });

      it("has an xrFitJustification of at least 30 characters", () => {
        expect(sim.xrFitJustification.length).toBeGreaterThanOrEqual(30);
      });

      it("has at least one valid board", () => {
        expect(sim.applicableBoards.length).toBeGreaterThan(0);
        sim.applicableBoards.forEach((b) => expect(VALID_BOARDS).toContain(b));
      });

      it("has at least one valid grade band", () => {
        expect(sim.gradeBands.length).toBeGreaterThan(0);
        sim.gradeBands.forEach((g) => expect(VALID_GRADE_BANDS).toContain(g));
      });

      it("has at least one valid subject", () => {
        expect(sim.subjects.length).toBeGreaterThan(0);
        sim.subjects.forEach((s) => expect(VALID_SUBJECTS).toContain(s));
      });

      it("has a valid simulationFormat", () => {
        expect(VALID_FORMATS).toContain(sim.simulationFormat);
      });

      it("has a valid evidenceConfidenceLevel", () => {
        expect(VALID_EVIDENCE_LEVELS).toContain(sim.evidenceConfidenceLevel);
      });

      it("has a valid comfortRiskLevel", () => {
        expect(VALID_COMFORT_RISKS).toContain(sim.comfortRiskLevel);
      });

      it("has a valid status", () => {
        expect(VALID_STATUSES).toContain(sim.status);
      });

      it("has a positive expectedDurationMinutes (max 12 for batch safety)", () => {
        expect(sim.expectedDurationMinutes).toBeGreaterThan(0);
        expect(sim.expectedDurationMinutes).toBeLessThanOrEqual(12);
      });

      it("has at least 2 stages", () => {
        expect(sim.stages).toBeGreaterThanOrEqual(2);
      });

      it("slug matches id pattern (id starts with sim-{slug})", () => {
        expect(sim.id).toContain(sim.slug.replace(/-/g, "-"));
      });
    });
  });

  it("no two simulations share the same slug", () => {
    const slugs = SIMULATIONS.map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("no two simulations share the same id", () => {
    const ids = SIMULATIONS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
