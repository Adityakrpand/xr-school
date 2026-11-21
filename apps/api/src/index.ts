import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: { level: "info" } });

await app.register(cors, {
  origin: ["http://localhost:3000", /http:\/\/192\.168\.\d+\.\d+:3000/],
});

// Simulation catalog — seed data matching TypeSpec SimulationModule model
const SIMULATIONS = [
  {
    id: "sim-pollination-001",
    slug: "pollination",
    title: "Plant Pollination & Growth Cycle",
    summary:
      "Walk through a flowering garden. Watch pollen transfer, seed formation, germination, and a full plant life cycle unfold in immersive VR.",
    gradeBands: ["class6To8", "class9To10"],
    subjects: ["biology", "environmentalScience"],
    applicableBoards: ["cbse", "icse"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Pollination occurs at microscopic scale and involves invisible pollen transfer that students cannot witness directly. VR makes the entire process—from pollen grain to seed formation—navigable and spatial in a way no diagram, video, or physical classroom can replicate.",
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
    summary:
      "Toggle a switch, swap resistors, and watch electrons flow in real time. Discover V=IR through direct interaction with a 3D circuit.",
    gradeBands: ["class8To10", "class9To10"],
    subjects: ["physics"],
    applicableBoards: ["cbse", "icse"],
    simulationFormat: "interactive3d",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Electric current is invisible. Visualising electron flow as glowing particles gives students a spatial, intuitive understanding of current direction and magnitude that no static diagram can provide. The real-time feedback between resistance, current, and bulb brightness makes Ohm's Law immediate and tactile.",
    learningObjective:
      "Students will apply Ohm's Law (V=IR) to predict how changing resistance affects current and explain observations in a series circuit.",
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
    summary:
      "Predict, pick up, and drop familiar objects into a transparent water tank, then use visible evidence to connect floating and sinking with average density.",
    gradeBands: ["class3To5"],
    subjects: ["science"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Immersive interaction lets each learner physically conduct repeated buoyancy trials and observe the full path above, at, and below the water surface from any angle. The transparent tank, immediate prediction feedback, and side-by-side density reveal make an otherwise hidden relationship spatial and memorable while avoiding the cleanup and limited visibility of a classroom demonstration.",
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
    summary:
      "Compare an egg in ordinary and salty water, then add and dissolve salt until the egg rises as water density and buoyant support increase.",
    gradeBands: ["class3To5"],
    subjects: ["science"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "The stationary two-tank laboratory lets each learner repeat the same controlled egg trial, see salt particles disperse through the water, and follow the egg below and above the surface as density changes. VR makes the otherwise invisible link between dissolved matter, density, and buoyant support spatial, immediate, and safe to explore.",
    learningObjective:
      "Students will compare egg buoyancy in ordinary and sufficiently salty water and explain that dissolved salt increases water density, helping objects and people float more easily.",
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
    summary:
      "Pour and stir sugar, salt, sand, cooking oil, flour, and stones, then compare dissolving, settling, clouding, and floating outcomes.",
    gradeBands: ["class3To5"],
    subjects: ["science"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "Each learner conducts six controlled pour-and-stir trials and observes particle-scale dissolving, sediment settling, suspended flour, and a floating oil layer from any angle. VR makes the contrasting outcomes close, repeatable, and safe while avoiding spills, consumables, cleanup, and limited classroom visibility.",
    learningObjective:
      "Students will test and classify six familiar substances as soluble or insoluble in water and explain that a dissolved substance still exists even when it is no longer visible.",
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
    summary:
      "Make fibre from polymer, then test rayon, nylon, polyester, and acrylic to compare their origins, properties, blends, uses, and fire safety.",
    gradeBands: ["class6To8"],
    subjects: ["science", "chemistry"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "The stationary textile laboratory makes the invisible polymer-to-fibre process visible, lets every learner compare four fibre types through repeatable strength, warmth, drying, and wrinkle tests, and demonstrates the fire hazard safely without specialist machinery or open flame.",
    learningObjective:
      "Students will explain how polymers become fibres, distinguish rayon, nylon, polyester, and acrylic by properties and uses, identify rayon as semi-synthetic, and apply fire-safety guidance.",
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
    summary:
      "Mould two identical plastic discs, reheat them, reveal polymer-chain movement and permanent cross-links, then choose the disc that can become a star badge.",
    gradeBands: ["class6To8"],
    subjects: ["science", "chemistry"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "The stationary virtual workshop makes invisible chain movement and cross-linking visible while each learner safely repeats heating, pressing, cooling, and remoulding tests. VR provides close-up evidence from identical-looking samples without hot machinery, fumes, damaged materials, or burn risk.",
    learningObjective:
      "Students will distinguish thermoplastics from thermosetting plastics by their response to reheating, explain the role of permanent cross-links, and classify common plastic objects.",
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
    summary:
      "Restore four important traffic signs, control a busy junction, complete the right-left-right zebra-crossing sequence, and pass Robo's road-safety challenge.",
    gradeBands: ["class3To5"],
    subjects: ["science", "environmentalScience"],
    applicableBoards: ["cbse", "icse", "stateBoard"],
    simulationFormat: "immersiveVr",
    xrFitType: "strongVrFit",
    xrFitJustification:
      "A stationary virtual junction lets every learner practise high-consequence road decisions repeatedly without exposure to real traffic. The city responds immediately to signs, lights, and crossing choices, making cause, consequence, visibility, and safe sequencing spatial in a way a worksheet cannot provide.",
    learningObjective:
      "Students will identify four important traffic signs, interpret red-yellow-green signals, and independently perform the complete safe zebra-crossing sequence.",
    evidenceConfidenceLevel: "expertDesigned",
    comfortRiskLevel: "low",
    expectedDurationMinutes: 5,
    stages: 6,
    status: "approved",
  },
];

app.get("/v1/simulation-modules", async () => ({
  items: SIMULATIONS,
  page: {
    page: 1,
    pageSize: 20,
    totalItems: SIMULATIONS.length,
    totalPages: 1,
  },
}));

app.get<{ Params: { moduleId: string } }>(
  "/v1/simulation-modules/:moduleId",
  async (req, reply) => {
    const sim = SIMULATIONS.find(
      (s) => s.id === req.params.moduleId || s.slug === req.params.moduleId,
    );
    if (!sim) {
      reply.code(404);
      return { code: "NOT_FOUND", message: "Simulation not found" };
    }
    return sim;
  },
);

app.get("/health", async () => ({
  status: "ok",
  service: "xr-school-api",
  version: "0.1.0",
}));

const host = "0.0.0.0";
const port = 3001;
await app.listen({ port, host });
console.log(`\n  ✓ API running at http://localhost:${port}`);
console.log(
  `  ✓ Simulations: http://localhost:${port}/v1/simulation-modules\n`,
);
