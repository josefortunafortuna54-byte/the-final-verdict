import { useState, useEffect } from "react";
import {
  collection, query, where, orderBy, limit, onSnapshot, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ActiveBattle {
  id: string;
  gladiator_a_name: string;
  gladiator_b_name: string;
  status: "active" | "judging" | "finished";
  current_round: number;
}

// Hook leve — só lê a batalha activa, nunca cria nada
export const useActiveBattle = () => {
  const [battle, setBattle] = useState<ActiveBattle | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "battles"),
      where("status", "==", "active"),
      orderBy("created_at", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setBattle(null);
        return;
      }
      const d = snap.docs[0];
      const data = d.data();
      setBattle({
        id:               d.id,
        gladiator_a_name: data.gladiator_a_name ?? "",
        gladiator_b_name: data.gladiator_b_name ?? "",
        status:           data.status ?? "active",
        current_round:    data.current_round ?? 1,
      });
    }, (err) => console.error("useActiveBattle error:", err));

    return () => unsub();
  }, []);

  return { battle };
};
