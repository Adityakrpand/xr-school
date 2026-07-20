export type ReactionId = 'magnesium' | 'combination' | 'decomposition' | 'displacement' | 'double-displacement';

export type ChemicalReaction = {
  id: ReactionId;
  title: string;
  type: string;
  equation: string;
  reactants: string[];
  products: string[];
  steps: string[];
  safety: string;
  observation: string;
  explanation: string;
  molecular: string;
  question: string;
  answers: string[];
  correctAnswer: number;
};

export const CHEMICAL_REACTIONS: readonly ChemicalReaction[] = [
  { id: 'magnesium', title: 'Burning Magnesium Ribbon', type: 'Combination / oxidation', equation: '2Mg + O₂ → 2MgO', reactants: ['Magnesium', 'Oxygen'], products: ['Magnesium oxide'], steps: ['Grip the tongs', 'Hold the magnesium ribbon', 'Ignite it at the burner', 'Observe the cooled white powder'], safety: 'Never stare at the brilliant flame or touch hot magnesium. Keep it in the fume hood.', observation: 'A brilliant white light is emitted and a white powder remains.', explanation: 'Magnesium gains oxygen and forms magnesium oxide. The mass increases because oxygen joins the metal.', molecular: 'Magnesium atoms transfer electrons to oxygen; oppositely charged Mg²⁺ and O²⁻ ions form an ionic lattice.', question: 'Why does the ribbon become white?', answers: ['Magnesium oxide forms', 'It melts into water', 'Copper coats it'], correctAnswer: 0 },
  { id: 'combination', title: 'Calcium Oxide + Water', type: 'Combination reaction', equation: 'CaO + H₂O → Ca(OH)₂', reactants: ['Calcium oxide', 'Water'], products: ['Calcium hydroxide'], steps: ['Place the beaker', 'Add calcium oxide', 'Add water slowly', 'Read the temperature rise'], safety: 'Calcium oxide and calcium hydroxide are corrosive. Wear goggles and avoid splashes.', observation: 'The beaker warms, steam appears, and calcium hydroxide forms.', explanation: 'Two reactants combine into one product and release heat, so this is an exothermic combination reaction.', molecular: 'Water hydrates calcium and oxide ions, producing calcium and hydroxide ions while energy is released.', question: 'Which evidence shows this reaction is exothermic?', answers: ['Temperature rises', 'The beaker becomes lighter', 'Oxygen disappears'], correctAnswer: 0 },
  { id: 'decomposition', title: 'Electrolysis of Water', type: 'Decomposition reaction', equation: '2H₂O → 2H₂ + O₂', reactants: ['Water'], products: ['Hydrogen', 'Oxygen'], steps: ['Connect the battery', 'Close the switch', 'Collect both gases', 'Test hydrogen behind the shield'], safety: 'Use low-voltage DC only. Test a tiny hydrogen sample behind the safety screen.', observation: 'Gas bubbles form at both electrodes; hydrogen volume is about twice oxygen volume.', explanation: 'Electrical energy decomposes water. Hydrogen gives a small pop when ignited.', molecular: 'Water molecules break bonds and rearrange into H₂ and O₂ molecules; this requires electrical energy.', question: 'What gas-volume ratio should be collected?', answers: ['2 hydrogen : 1 oxygen', '1 hydrogen : 2 oxygen', 'Equal volumes'], correctAnswer: 0 },
  { id: 'displacement', title: 'Iron + Copper Sulphate', type: 'Displacement reaction', equation: 'Fe + CuSO₄ → FeSO₄ + Cu', reactants: ['Iron', 'Copper sulphate'], products: ['Iron sulphate', 'Copper'], steps: ['Inspect the blue solution', 'Lower the clean iron nail', 'Start time-lapse', 'Inspect the nail and solution'], safety: 'Copper sulphate is harmful if swallowed. Handle with gloves and use the labelled waste container.', observation: 'The blue solution turns greenish and reddish-brown copper coats the nail.', explanation: 'More reactive iron displaces copper from copper sulphate solution.', molecular: 'Iron atoms become Fe²⁺ ions while Cu²⁺ ions gain electrons and deposit as copper atoms.', question: 'Why can iron replace copper?', answers: ['Iron is more reactive', 'Copper is a gas', 'Iron is less dense'], correctAnswer: 0 },
  { id: 'double-displacement', title: 'Silver Nitrate + Sodium Chloride', type: 'Double displacement / precipitation', equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃', reactants: ['Silver nitrate', 'Sodium chloride'], products: ['Silver chloride', 'Sodium nitrate'], steps: ['Place the clean test tube', 'Add sodium chloride solution', 'Add silver nitrate', 'Observe the precipitate'], safety: 'Silver nitrate stains skin and damages eyes. Wear gloves and goggles; collect waste separately.', observation: 'A curdy white silver chloride precipitate forms and settles.', explanation: 'Ions exchange partners; insoluble silver chloride leaves the solution as a precipitate.', molecular: 'Ag⁺ and Cl⁻ ions meet to form solid AgCl while Na⁺ and NO₃⁻ remain spectator ions.', question: 'Which product is the white precipitate?', answers: ['Silver chloride', 'Sodium nitrate', 'Iron sulphate'], correctAnswer: 0 },
] as const;

export function evaluateReactionAnswer(reactionId: ReactionId, answerIndex: number) {
  const reaction = CHEMICAL_REACTIONS.find(item => item.id === reactionId);
  if (!reaction) throw new Error(`Unknown reaction: ${reactionId}`);
  return { correct: answerIndex === reaction.correctAnswer, explanation: reaction.explanation };
}

export function isBalancedEquation(equation: string) {
  return CHEMICAL_REACTIONS.some(reaction => reaction.equation === equation);
}
