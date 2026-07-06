import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, limit,
  addDoc, updateDoc, deleteDoc,
  doc, getDocs, onSnapshot,
  serverTimestamp, Timestamp,
  where, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Gladiator {
  id: string;
  name: string;
  alias?: string;
  avatarUrl?: string;
  wins: number;
  losses: number;
  totalBattles: number;
  totalReactions: number;
  winRate: number;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docToGladiator = (id: string, data: Record<string, any>): Gladiator => {
  const wins   = data.wins   ?? 0;
  const losses = data.losses ?? 0;
  const total  = wins + losses;
  return {
    id,
    name:           data.name ?? "",
    alias:          data.alias ?? "",
    avatarUrl:      data.avatarUrl ?? "",
    wins,
    losses,
    totalBattles:   total,
    totalReactions: data.totalReactions ?? 0,
    winRate:        total > 0 ? Math.round((wins / total) * 100) : 0,
    createdAt:      data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    updatedAt:      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
  };
};

export const useGladiators = () => {
  const [gladiators, setGladiators] = useState<Gladiator[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const q = query(collection(db, "gladiators"), orderBy("wins", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setGladiators(snap.docs.map((d) => docToGladiator(d.id, d.data())));
      setLoading(false);
    }, (err) => {
      console.error("Gladiators snapshot error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addGladiator = useCallback(async (data: {
    name: string;
    alias?: string;
    avatarUrl?: string;
  }) => {
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "gladiators"), {
        name:           data.name.trim().toUpperCase(),
        alias:          data.alias?.trim() ?? "",
        avatarUrl:      data.avatarUrl?.trim() ?? "",
        wins:           0,
        losses:         0,
        totalReactions: 0,
        createdAt:      serverTimestamp(),
        updatedAt:      serverTimestamp(),
      });
      return ref.id;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateGladiator = useCallback(async (id: string, data: Partial<{
    name: string;
    alias: string;
    avatarUrl: string;
  }>) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "gladiators", id), {
        ...data,
        ...(data.name && { name: data.name.trim().toUpperCase() }),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteGladiator = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "gladiators", id));
  }, []);

  interface GladiatorDoc {
    id: string;
    name?: string;
    wins?: number;
    losses?: number;
    totalReactions?: number;
    [key: string]: unknown;
  }

  // Chamado após cada batalha para actualizar stats
  const recordBattleResult = useCallback(async (
    winnerName: string,
    loserName: string,
    reactions: { fire: number; heart: number; impact: number }
  ) => {
    const snap = await getDocs(collection(db, "gladiators"));
    const allGladiators: GladiatorDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GladiatorDoc));

    const winner = allGladiators.find((g) =>
      (g.name ?? "").toUpperCase() === winnerName.toUpperCase()
    );
    const loser = allGladiators.find((g) =>
      (g.name ?? "").toUpperCase() === loserName.toUpperCase()
    );

    const totalRx = reactions.fire + reactions.heart + reactions.impact;

    if (winner) {
      await updateDoc(doc(db, "gladiators", winner.id), {
        wins:           (winner.wins ?? 0) + 1,
        totalReactions: (winner.totalReactions ?? 0) + totalRx,
        updatedAt:      serverTimestamp(),
      });
    }
    if (loser) {
      await updateDoc(doc(db, "gladiators", loser.id), {
        losses:    (loser.losses ?? 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }
  }, []);

  // Busca gladiador por nome (para o BattleSetupModal)
  const searchGladiators = useCallback((query: string): Gladiator[] => {
    if (!query.trim()) return gladiators;
    const q = query.trim().toUpperCase();
    return gladiators.filter((g) =>
      g.name.includes(q) || (g.alias ?? "").toUpperCase().includes(q)
    );
  }, [gladiators]);

  return {
    gladiators,
    loading,
    saving,
    addGladiator,
    updateGladiator,
    deleteGladiator,
    recordBattleResult,
    searchGladiators,
  };
};
