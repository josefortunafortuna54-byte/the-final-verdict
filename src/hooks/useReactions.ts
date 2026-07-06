import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, orderBy, limit,
  addDoc, onSnapshot, getDocs, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkRateLimit } from "@/lib/rateLimit";

export interface ReactionCount {
  fire: number;
  heart: number;
  impact: number;
}

export const useReactions = (battleId?: string, currentRound?: number) => {
  const [reactionCounts, setReactionCounts] = useState<ReactionCount>({ fire: 0, heart: 0, impact: 0 });

  useEffect(() => {
    if (!battleId) return;

    getDocs(query(collection(db, "reactions"), where("battle_id", "==", battleId))).then((snap) => {
      const counts = { fire: 0, heart: 0, impact: 0 };
      snap.forEach((d) => {
        const e = d.data().emoji as string;
        if (e === "🔥") counts.fire++;
        else if (e === "❤️") counts.heart++;
        else if (e === "⚡") counts.impact++;
      });
      setReactionCounts(counts);
    }).catch((err) => console.error("Error fetching initial reactions:", err));

    let initialized = false;
    const unsub = onSnapshot(
      query(collection(db, "reactions"), where("battle_id", "==", battleId), orderBy("created_at", "desc"), limit(500)),
      (snap) => {
        if (!initialized) { initialized = true; return; }
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const emoji = change.doc.data().emoji as string;
            setReactionCounts((prev) => ({
              fire: prev.fire + (emoji === "🔥" ? 1 : 0),
              heart: prev.heart + (emoji === "❤️" ? 1 : 0),
              impact: prev.impact + (emoji === "⚡" ? 1 : 0),
            }));
          }
        });
      },
      (err) => console.error("Reactions snapshot error:", err)
    );

    return () => unsub();
  }, [battleId]);

  const sendReaction = useCallback(async (emoji: string) => {
    if (!battleId) return;
    if (!checkRateLimit(`reaction:${battleId}`, 200)) return;
    try {
      await addDoc(collection(db, "reactions"), {
        battle_id: battleId, emoji, round: currentRound ?? 1, created_at: serverTimestamp(),
      });
    } catch (error) { console.error("Error sending reaction:", error); }
  }, [battleId, currentRound]);

  return { reactionCounts, sendReaction };
};
