export type CriterionKey =
  | "rimas"
  | "punchlines"
  | "flow"
  | "criatividade"
  | "agressividade";

export const CRITERIA: { key: CriterionKey; label: string }[] = [
  { key: "rimas", label: "RIMAS" },
  { key: "punchlines", label: "PUNCHLINES" },
  { key: "flow", label: "FLOW" },
  { key: "criatividade", label: "CRIATIVIDADE" },
  { key: "agressividade", label: "AGRESSIVIDADE" },
];

export interface AIScores {
  Rimas: number;
  Punchlines: number;
  Flow: number;
  Criatividade: number;
  Agressividade: number;
}

export const AI_CRITERION_KEY: Record<CriterionKey, keyof AIScores> = {
  rimas: "Rimas",
  punchlines: "Punchlines",
  flow: "Flow",
  criatividade: "Criatividade",
  agressividade: "Agressividade",
};

export interface RoundScore {
  round: number;
  a: Record<CriterionKey, number>;
  b: Record<CriterionKey, number>;
  totalA: number;
  totalB: number;
}

export interface BattleScorecard {
  rounds: RoundScore[];
  finalA: number;
  finalB: number;
  winnerSide: "A" | "B";
}

const mulberry32 = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const prngScore = (rng: () => number) => Math.round(60 + rng() * 38);

export const generateScorecard = (
  battleId: string,
  energyA: number,
  energyB: number,
  reactionBonusA = 0,
  reactionBonusB = 0,
  voteA = 0,
  voteB = 0,
  aiScoresA: AIScores[] = [],
  aiScoresB: AIScores[] = [],
): BattleScorecard => {
  const rng = mulberry32(hashString(battleId || "default"));
  const rounds: RoundScore[] = [];

  for (let r = 1; r <= 3; r++) {
    const a: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;
    const b: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;

    const aiA = aiScoresA[r - 1];
    const aiB = aiScoresB[r - 1];

    for (const c of CRITERIA) {
      const aiKey = AI_CRITERION_KEY[c.key];
      a[c.key] = aiA ? (aiA[aiKey] ?? prngScore(rng)) : prngScore(rng);
      b[c.key] = aiB ? (aiB[aiKey] ?? prngScore(rng)) : prngScore(rng);
    }

    const totalA = CRITERIA.reduce((s, c) => s + a[c.key], 0);
    const totalB = CRITERIA.reduce((s, c) => s + b[c.key], 0);
    rounds.push({ round: r, a, b, totalA, totalB });
  }

  const energyBiasA = (energyA - 75) * 5;
  const energyBiasB = (energyB - 75) * 5;

  const rawA =
    rounds.reduce((s, r) => s + r.totalA, 0) + energyBiasA + reactionBonusA;
  const rawB =
    rounds.reduce((s, r) => s + r.totalB, 0) + energyBiasB + reactionBonusB;

  const finalA = Math.round(rawA);
  const finalB = Math.round(rawB);

  let winnerSide: "A" | "B";
  if (finalA > finalB) {
    winnerSide = "A";
  } else if (finalB > finalA) {
    winnerSide = "B";
  } else if (voteA > voteB) {
    winnerSide = "A";
  } else if (voteB > voteA) {
    winnerSide = "B";
  } else if (energyA > energyB) {
    winnerSide = "A";
  } else if (energyB > energyA) {
    winnerSide = "B";
  } else {
    winnerSide = rng() > 0.5 ? "A" : "B";
  }

  return { rounds, finalA, finalB, winnerSide };
};
