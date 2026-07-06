import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection, query, orderBy, limit, startAfter,
  addDoc, getDocs, onSnapshot, getCountFromServer,
  serverTimestamp, Timestamp, QueryDocumentSnapshot, DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BattleScorecard } from "@/lib/battleScoring";

export interface BattleHistoryEntry {
  id: string;
  battle_id: string | null;
  gladiator_a_name: string;
  gladiator_b_name: string;
  gladiator_a_final_energy: number;
  gladiator_b_final_energy: number;
  winner: string;
  total_reactions: number;
  fire_reactions: number;
  heart_reactions: number;
  impact_reactions: number;
  created_at: string;
  scorecard?: BattleScorecard | null;
}

const PAGE_SIZE = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docToEntry = (id: string, data: Record<string, any>): BattleHistoryEntry => ({
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

export const useBattleHistory = () => {
  const [history, setHistory]       = useState<BattleHistoryEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore]       = useState(false);

  // Cursors por página: cursors[0] = início, cursors[1] = cursor para página 2, etc.
  const cursors = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([null]);
  const unsubRef = useRef<(() => void) | null>(null);

  // Conta total de documentos
  const fetchCount = useCallback(async () => {
    try {
      const snap = await getCountFromServer(collection(db, "battle_history"));
      setTotalCount(snap.data().count);
    } catch {
      // getCountFromServer pode não estar disponível em todos os planos
    }
  }, []);

  // Subscreve uma página específica via onSnapshot
  const subscribePage = useCallback((cursor: QueryDocumentSnapshot<DocumentData> | null) => {
    // Cancela a subscrição anterior
    unsubRef.current?.();

    const q = cursor
      ? query(collection(db, "battle_history"), orderBy("created_at", "desc"), startAfter(cursor), limit(PAGE_SIZE))
      : query(collection(db, "battle_history"), orderBy("created_at", "desc"), limit(PAGE_SIZE));

    const unsub = onSnapshot(q, (snap) => {
      const entries = snap.docs.map((d) => docToEntry(d.id, d.data()));
      setHistory(entries);
      setHasMore(entries.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);

      // Guarda o cursor do último documento desta página para poder avançar
      const lastDoc = snap.docs[snap.docs.length - 1];
      if (lastDoc) {
        const pageIdx = cursors.current.length;
        cursors.current[pageIdx] = lastDoc;
      }
    }, (err) => {
      console.error("History snapshot error:", err);
      setLoading(false);
      setLoadingMore(false);
    });

    unsubRef.current = unsub;
  }, []);

  // Inicialização
  useEffect(() => {
    fetchCount();
    subscribePage(null);
    return () => unsubRef.current?.();
  }, [subscribePage, fetchCount]);

  // Próxima página
  const nextPage = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const cursor = cursors.current[currentPage]; // cursor guardado ao receber a página actual
    if (!cursor) return;
    setCurrentPage((p) => p + 1);
    subscribePage(cursor);
  }, [hasMore, loadingMore, currentPage, subscribePage]);

  // Página anterior
  const prevPage = useCallback(() => {
    if (currentPage <= 1 || loadingMore) return;
    setLoadingMore(true);
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    // Cursor da página anterior (índice newPage - 1; página 1 usa null)
    const cursor = newPage === 1 ? null : cursors.current[newPage - 1];
    subscribePage(cursor ?? null);
  }, [currentPage, loadingMore, subscribePage]);

  // Ir para uma página específica (só suportado se já temos os cursors)
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page === currentPage || loadingMore) return;
    if (page > cursors.current.length && page > 1) return; // cursor não disponível
    setLoadingMore(true);
    setCurrentPage(page);
    const cursor = page === 1 ? null : cursors.current[page - 1] ?? null;
    subscribePage(cursor);
  }, [currentPage, loadingMore, subscribePage]);

  // Refresh — volta à página 1
  const fetchHistory = useCallback(() => {
    cursors.current = [null];
    setCurrentPage(1);
    setLoading(true);
    fetchCount();
    subscribePage(null);
  }, [subscribePage, fetchCount]);

  const addToHistory = useCallback(async (entry: Omit<BattleHistoryEntry, "id" | "created_at">) => {
    try {
      await addDoc(collection(db, "battle_history"), {
        ...entry,
        created_at: serverTimestamp(),
      });
      // Actualiza a contagem
      setTotalCount((c) => c + 1);
    } catch (error) {
      console.error("Error adding to battle history:", error);
    }
  }, []);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : null;

  return {
    history, loading, loadingMore,
    totalCount, totalPages, currentPage, hasMore,
    addToHistory, fetchHistory,
    nextPage, prevPage, goToPage,
  };
};
