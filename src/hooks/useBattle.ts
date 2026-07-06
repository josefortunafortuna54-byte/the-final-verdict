import { useState, useEffect, useCallback } from "react";
import {
  doc, collection, query, where, orderBy, limit,
  addDoc, updateDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { generateScorecard, type BattleScorecard, type AIScores } from "@/lib/battleScoring";
import { useReactions, type ReactionCount } from "@/hooks/useReactions";
import { useGeminiAnalysis } from "@/hooks/useGeminiAnalysis";

export interface Battle {
  id: string;
  gladiator_a_name: string;
  gladiator_b_name: string;
  gladiator_a_energy: number;
  gladiator_b_energy: number;
  gladiator_a_avatar?: string | null;
  gladiator_b_avatar?: string | null;
  current_round: number;
  status: "active" | "judging" | "finished";
  winner: string | null;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docToBattle = (id: string, data: Record<string, any>): Battle => ({
  id,
  gladiator_a_name: data.gladiator_a_name ?? "MC A",
  gladiator_b_name: data.gladiator_b_name ?? "MC B",
  gladiator_a_energy: data.gladiator_a_energy ?? 75,
  gladiator_b_energy: data.gladiator_b_energy ?? 75,
  gladiator_a_avatar: data.gladiator_a_avatar ?? null,
  gladiator_b_avatar: data.gladiator_b_avatar ?? null,
  current_round: data.current_round ?? 1,
  status: data.status ?? "active",
  winner: data.winner ?? null,
  created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : new Date().toISOString(),
  updated_at: data.updated_at instanceof Timestamp ? data.updated_at.toDate().toISOString() : new Date().toISOString(),
});

export type RecordingPhase = "idle" | "awaiting_a" | "awaiting_b" | "complete";

export const useBattle = (battleId?: string) => {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [scorecard, setScorecard] = useState<BattleScorecard | null>(null);
  const [isSetup, setIsSetup] = useState(false);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [recordingPhase, setRecordingPhase] = useState<RecordingPhase>("idle");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { reactionCounts, sendReaction } = useReactions(battle?.id, battle?.current_round);
  const { analyzeAudio } = useGeminiAnalysis();

  const initBattle = useCallback(async () => {
    try {
      if (battleId) {
        const snap = await getDoc(doc(db, "battles", battleId));
        if (snap.exists()) {
          const b = docToBattle(snap.id, snap.data());
          setBattle(b);
          setIsSetup(b.gladiator_a_name !== "MC A" && b.gladiator_b_name !== "MC B");
        }
      } else {
        const q = query(collection(db, "battles"), where("status", "==", "active"), orderBy("created_at", "desc"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          const b = docToBattle(d.id, d.data());
          setBattle(b);
          setIsSetup(b.gladiator_a_name !== "MC A" && b.gladiator_b_name !== "MC B");
        } else {
          const ref = await addDoc(collection(db, "battles"), {
            gladiator_a_name: "MC A", gladiator_b_name: "MC B",
            gladiator_a_energy: 75, gladiator_b_energy: 75,
            current_round: 1, status: "active", winner: null,
            created_at: serverTimestamp(), updated_at: serverTimestamp(),
          });
          const newSnap = await getDoc(ref);
          setBattle(docToBattle(ref.id, newSnap.data()!));
          setIsSetup(false);
        }
      }
    } catch (error) {
      console.error("Error initializing battle:", error);
      toast({ title: "Erro", description: "Não foi possível carregar a batalha", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [battleId, toast]);

  useEffect(() => { initBattle(); }, [initBattle]);

  useEffect(() => {
    if (!battle?.id) return;

    const unsub = onSnapshot(doc(db, "battles", battle.id), (snap) => {
      if (snap.exists()) setBattle(docToBattle(snap.id, snap.data()));
    });

    return () => unsub();
  }, [battle?.id]);

  const updateBattle = useCallback(async (updates: Partial<Battle>) => {
    if (!battle?.id) return;
    try {
      await updateDoc(doc(db, "battles", battle.id), { ...updates, updated_at: serverTimestamp() });
    } catch (error) {
      console.error("Error updating battle:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a batalha", variant: "destructive" });
    }
  }, [battle?.id, toast]);

  const advanceRound = useCallback(async () => {
    if (!battle || battle.current_round >= 3) return;
    const newEnergyA = Math.min(100, battle.gladiator_a_energy + Math.random() * 20 - 5);
    const newEnergyB = Math.min(100, battle.gladiator_b_energy + Math.random() * 20 - 5);
    await updateBattle({ current_round: battle.current_round + 1, gladiator_a_energy: Math.round(newEnergyA), gladiator_b_energy: Math.round(newEnergyB) });
    setRecordingPhase("awaiting_a");
  }, [battle, updateBattle]);

  const registerRecording = useCallback((side: "a" | "b", blob: Blob) => {
    const key = `${side}_${battle?.current_round ?? 1}`;
    setRecordings((prev) => ({ ...prev, [key]: blob }));
    if (side === "a") {
      setRecordingPhase("awaiting_b");
    } else {
      setRecordingPhase("complete");
    }
  }, [battle?.current_round]);

  const startJudgment = useCallback(async () => {
    if (!battle) return;
    await updateBattle({ status: "judging" });
    setIsAnalyzing(true);

    let voteA = 0, voteB = 0;
    try {
      const votesSnap = await getDocs(query(collection(db, "votes"), where("battle_id", "==", battle.id)));
      votesSnap.forEach((d) => { if (d.data().side === "a") voteA++; else if (d.data().side === "b") voteB++; });
    } catch (err) { console.error("Error fetching votes:", err); }

    // Análise com Gemini — cada áudio é enviado e scores são consolidados
    const aScores: AIScores[] = [];
    const bScores: AIScores[] = [];

    for (let round = 1; round <= 3; round++) {
      const aBlob = recordings[`a_${round}`];
      const bBlob = recordings[`b_${round}`];
      if (aBlob) {
        const s = await analyzeAudio(aBlob);
        if (s) aScores.push(s);
      }
      if (bBlob) {
        const s = await analyzeAudio(bBlob);
        if (s) bScores.push(s);
      }
    }

    let card: BattleScorecard;
    const useAiScores = aScores.length > 0 && bScores.length > 0;

    if (useAiScores) {
      card = generateScorecard(
        battle.id,
        battle.gladiator_a_energy,
        battle.gladiator_b_energy,
        0, 0, voteA, voteB,
        aScores,
        bScores,
      );
    } else {
      // Fallback: PRNG seedado se Gemini falhar ou não houver áudios
      const reactionEngagement = reactionCounts.fire * 0.3 + reactionCounts.heart * 0.2 + reactionCounts.impact * 0.25;
      const totalVotes = voteA + voteB;
      const voteWeight = 20 + Math.min(reactionEngagement, 30);
      const voteBonusA = totalVotes > 0 ? (voteA / totalVotes) * voteWeight : voteWeight / 2;
      const voteBonusB = totalVotes > 0 ? (voteB / totalVotes) * voteWeight : voteWeight / 2;

      card = generateScorecard(battle.id, battle.gladiator_a_energy, battle.gladiator_b_energy, voteBonusA, voteBonusB, voteA, voteB);
    }

    setScorecard(card);
    setIsAnalyzing(false);

    const finalEnergyA = Math.min(100, Math.round(card.finalA / 15));
    const finalEnergyB = Math.min(100, Math.round(card.finalB / 15));

    setTimeout(async () => {
      const winner = card.winnerSide === "A" ? battle.gladiator_a_name : battle.gladiator_b_name;
      await updateBattle({ status: "finished", winner, gladiator_a_energy: finalEnergyA, gladiator_b_energy: finalEnergyB });
    }, 18000);
  }, [battle, reactionCounts, recordings, analyzeAudio, updateBattle]);

  const setupBattle = useCallback(async (nameA: string, nameB: string, avatarA?: string, avatarB?: string) => {
    if (!battle?.id) return;
    try {
      await updateDoc(doc(db, "battles", battle.id), {
        gladiator_a_name: nameA,
        gladiator_b_name: nameB,
        ...(avatarA !== undefined && { gladiator_a_avatar: avatarA }),
        ...(avatarB !== undefined && { gladiator_b_avatar: avatarB }),
        updated_at: serverTimestamp(),
      });
      setIsSetup(true);
    } catch (error) {
      console.error("Error setting up battle:", error);
      toast({ title: "Erro", description: "Não foi possível configurar a batalha", variant: "destructive" });
    }
  }, [battle?.id, toast]);

  const createNewBattle = useCallback(async () => {
    setLoading(true);
    setIsSetup(false);
    setRecordings({});
    setRecordingPhase("idle");
    setScorecard(null);
    try {
      const ref = await addDoc(collection(db, "battles"), {
        gladiator_a_name: "MC A", gladiator_b_name: "MC B",
        gladiator_a_energy: 75, gladiator_b_energy: 75,
        current_round: 1, status: "active", winner: null,
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      setBattle(docToBattle(ref.id, snap.data()!));
    } catch (error) {
      console.error("Error creating battle:", error);
      toast({ title: "Erro", description: "Não foi possível criar nova batalha", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { battle, reactionCounts, loading, scorecard, isSetup, isAnalyzing, recordings, recordingPhase, sendReaction, advanceRound, registerRecording, startJudgment, createNewBattle, setupBattle, updateBattle };
};
