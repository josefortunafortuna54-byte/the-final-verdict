import { useState, useEffect } from "react";
import {
  doc, getDoc, collection, query,
  orderBy, limit, getDocs, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Gladiator } from "@/hooks/useGladiators";
import type { BattleHistoryEntry } from "@/hooks/useBattleHistory";

export interface GladiatorProfile {
  gladiator: Gladiator;
  battles: BattleHistoryEntry[];
  // Derivados
  longestWinStreak: number;
  avgReactionsPerBattle: number;
  bestCriteria: string | null;    // critério com maior média
  worstCriteria: string | null;   // critério com menor média
  winsVsTop: { opponent: string; wins: number; losses: number }[];
  reactionBreakdown: { fire: number; heart: number; impact: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docToBattle = (id: string, data: Record<string, any>): BattleHistoryEntry => ({
  id,
  battle_id:                data.battle_id ?? null,
  gladiator_a_name:         data.gladiator_a_name ?? "",
  gladiator_b_name:         data.gladiator_b_name ?? "",
  gladiator_a_final_energy: data.gladiator_a_final_energy ?? 0,
  gladiator_b_final_energy: data.gladiator_b_final_energy ?? 0,
  winner:                   data.winner ?? "",
  total_reactions:          data.total_reactions ?? 0,
  fire_reactions:           data.fire_reactions ?? 0,
  heart_reactions:          data.heart_reactions ?? 0,
  impact_reactions:         data.impact_reactions ?? 0,
  created_at:               data.created_at instanceof Timestamp
    ? data.created_at.toDate().toISOString()
    : new Date().toISOString(),
  scorecard: data.scorecard ?? null,
});

export const useGladiatorProfile = (gladiatorId: string | undefined) => {
  const [profile, setProfile] = useState<GladiatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!gladiatorId) { setLoading(false); return; }

    const load = async () => {
      try {
        // 1. Busca gladiador + histórico em paralelo
        const [gladSnap, histSnap] = await Promise.all([
          getDoc(doc(db, "gladiators", gladiatorId)),
          getDocs(query(collection(db, "battle_history"), orderBy("created_at", "desc"), limit(100))),
        ]);

        if (!gladSnap.exists()) {
          setError("Gladiador não encontrado");
          setLoading(false);
          return;
        }

        const g = gladSnap.data();
        const wins   = g.wins   ?? 0;
        const losses = g.losses ?? 0;
        const total  = wins + losses;
        const gladiator: Gladiator = {
          id:             gladSnap.id,
          name:           g.name ?? "",
          alias:          g.alias ?? "",
          avatarUrl:      g.avatarUrl ?? "",
          wins,
          losses,
          totalBattles:   total,
          totalReactions: g.totalReactions ?? 0,
          winRate:        total > 0 ? Math.round((wins / total) * 100) : 0,
          createdAt:      g.createdAt instanceof Timestamp ? g.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt:      g.updatedAt instanceof Timestamp ? g.updatedAt.toDate().toISOString() : new Date().toISOString(),
        };

        const allBattles = histSnap.docs.map((d) => docToBattle(d.id, d.data()));
        const myBattles  = allBattles.filter((b) =>
          b.gladiator_a_name.toUpperCase() === gladiator.name.toUpperCase() ||
          b.gladiator_b_name.toUpperCase() === gladiator.name.toUpperCase()
        );

        // 3. Deriva estatísticas
        // Maior sequência de vitórias
        let streak = 0, best = 0;
        myBattles.slice().reverse().forEach((b) => {
          if (b.winner.toUpperCase() === gladiator.name.toUpperCase()) {
            streak++;
            best = Math.max(best, streak);
          } else {
            streak = 0;
          }
        });

        // Média de reações por batalha
        const avgRx = myBattles.length > 0
          ? Math.round(myBattles.reduce((s, b) => s + b.total_reactions, 0) / myBattles.length)
          : 0;

        // Melhor / pior critério do scorecard
        const criteria = ["rimas", "punchlines", "flow", "criatividade", "agressividade"];
        const criAvg: Record<string, number> = {};
        const criCount: Record<string, number> = {};
        myBattles.forEach((b) => {
          if (!b.scorecard) return;
          const isA = b.gladiator_a_name.toUpperCase() === gladiator.name.toUpperCase();
          b.scorecard.rounds.forEach((r) => {
            criteria.forEach((crit) => {
              const val = isA
                ? (r.a[crit as keyof typeof r.a] ?? 0)
                : (r.b[crit as keyof typeof r.b] ?? 0);
              criAvg[crit]   = (criAvg[crit]   ?? 0) + val;
              criCount[crit] = (criCount[crit] ?? 0) + 1;
            });
          });
        });
        const criMeans = criteria.map((c) => ({
          c,
          avg: criCount[c] ? criAvg[c] / criCount[c] : 0,
        }));
        const sorted      = criMeans.sort((a, b) => b.avg - a.avg);
        const bestCriteria  = sorted[0]?.avg > 0 ? sorted[0].c : null;
        const worstCriteria = sorted[sorted.length - 1]?.avg > 0 ? sorted[sorted.length - 1].c : null;

        // Head-to-head vs cada adversário
        const h2h: Record<string, { wins: number; losses: number }> = {};
        myBattles.forEach((b) => {
          const opponent =
            b.gladiator_a_name.toUpperCase() === gladiator.name.toUpperCase()
              ? b.gladiator_b_name
              : b.gladiator_a_name;
          if (!h2h[opponent]) h2h[opponent] = { wins: 0, losses: 0 };
          if (b.winner.toUpperCase() === gladiator.name.toUpperCase()) h2h[opponent].wins++;
          else h2h[opponent].losses++;
        });
        const winsVsTop = Object.entries(h2h)
          .map(([opponent, rec]) => ({ opponent, ...rec }))
          .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
          .slice(0, 5);

        // Breakdown de reações
        const reactionBreakdown = {
          fire:   myBattles.reduce((s, b) => s + b.fire_reactions, 0),
          heart:  myBattles.reduce((s, b) => s + b.heart_reactions, 0),
          impact: myBattles.reduce((s, b) => s + b.impact_reactions, 0),
        };

        setProfile({
          gladiator,
          battles:              myBattles,
          longestWinStreak:     best,
          avgReactionsPerBattle: avgRx,
          bestCriteria,
          worstCriteria,
          winsVsTop,
          reactionBreakdown,
        });
      } catch (err) {
        console.error("useGladiatorProfile:", err);
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [gladiatorId]);

  return { profile, loading, error };
};
