import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, addDoc,
  onSnapshot, getDocs, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkRateLimit } from "@/lib/rateLimit";

export interface VoteCounts {
  a: number;
  b: number;
  total: number;
  percentA: number;
  percentB: number;
}

const STORAGE_KEY = "tfv_voted_battle";

export const useVotes = (battleId?: string) => {
  const [votes, setVotes] = useState<VoteCounts>({ a: 0, b: 0, total: 0, percentA: 50, percentB: 50 });
  const [hasVoted, setHasVoted] = useState(false);
  const [votedSide, setVotedSide] = useState<"a" | "b" | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const computeCounts = useCallback((docs: { side: string }[]) => {
    const a = docs.filter((v) => v.side === "a").length;
    const b = docs.filter((v) => v.side === "b").length;
    const total = a + b;
    return { a, b, total, percentA: total === 0 ? 50 : Math.round((a / total) * 100), percentB: total === 0 ? 50 : Math.round((b / total) * 100) };
  }, []);

  // Check localStorage for previous vote
  useEffect(() => {
    if (!battleId) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.battleId === battleId) { setHasVoted(true); setVotedSide(parsed.side); }
      }
    } catch { /* ignore */ }
  }, [battleId]);

  useEffect(() => {
    if (!battleId) return;

    // Initial fetch
    getDocs(query(collection(db, "votes"), where("battle_id", "==", battleId))).then((snap) => {
      setVotes(computeCounts(snap.docs.map((d) => ({ side: d.data().side as string }))));
    }).catch((err) => console.error("Error fetching initial votes:", err));

    // Realtime subscription
    const unsub = onSnapshot(
      query(collection(db, "votes"), where("battle_id", "==", battleId)),
      (snap) => {
        setVotes(computeCounts(snap.docs.map((d) => ({ side: d.data().side as string }))));
      },
      (err) => console.error("Votes snapshot error:", err)
    );

    return () => unsub();
  }, [battleId, computeCounts]);

  const castVote = useCallback(async (side: "a" | "b") => {
    if (!battleId || hasVoted || isVoting) return;
    if (!checkRateLimit(`vote:${battleId}`, 1000)) return;
    setIsVoting(true);
    try {
      await addDoc(collection(db, "votes"), { battle_id: battleId, side, created_at: serverTimestamp() });
      setHasVoted(true);
      setVotedSide(side);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ battleId, side }));
    } catch (err) {
      console.error("castVote:", err);
    } finally {
      setIsVoting(false);
    }
  }, [battleId, hasVoted, isVoting]);

  return { votes, hasVoted, votedSide, isVoting, castVote };
};
