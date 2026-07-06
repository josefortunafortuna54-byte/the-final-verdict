import { useState, useEffect, useRef, useCallback } from "react";

export interface Notification {
  id: string;
  type: "battle_start" | "round_change" | "judging" | "winner" | "info";
  title: string;
  message: string;
  emoji: string;
  duration?: number; // ms — default 5000
}

// ── Pede permissão ao browser para notificações ────────────────────────
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

// ── Dispara notificação nativa do browser ──────────────────────────────
const sendBrowserNotification = (title: string, body: string, icon = "/logo.svg") => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon, badge: "/favicon-32.png" });
  } catch { /* ignore */ }
};

// ── Hook ──────────────────────────────────────────────────────────────
export const useNotifications = () => {
  const [notifications, setNotifications]       = useState<Notification[]>([]);
  const [permission, setPermission]             = useState<NotificationPermission>("default");
  const notifIdCounter                          = useRef(0);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const push = useCallback((notif: Omit<Notification, "id">) => {
    const id = `notif-${Date.now()}-${notifIdCounter.current++}`;
    setNotifications((prev) => [{ ...notif, id }, ...prev].slice(0, 5));

    // Auto-remove após duration
    const dur = notif.duration ?? 6000;
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, dur);

    // Notificação nativa do browser
    sendBrowserNotification(`${notif.emoji} ${notif.title}`, notif.message);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if ("Notification" in window) setPermission(Notification.permission);
    return granted;
  }, []);

  return { notifications, permission, push, dismiss, requestPermission };
};

// ── Hook que observa batalha e dispara notificações automáticas ────────
interface BattleState {
  status?: string;
  current_round?: number;
  winner?: string | null;
  gladiator_a_name?: string;
  gladiator_b_name?: string;
  id?: string;
}

export const useBattleNotifications = (
  battle: BattleState | null,
  push: (n: Omit<Notification, "id">) => void
) => {
  const prevRef    = useRef<BattleState | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!battle) return;

    // Ignora o primeiro render (não dispara na montagem)
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = { ...battle };
      return;
    }

    const prev = prevRef.current;
    const curr = battle;

    // Nova batalha (id mudou)
    if (prev?.id !== curr.id && curr.id) {
      push({
        type:    "battle_start",
        emoji:   "⚔️",
        title:   "NOVA BATALHA",
        message: `${curr.gladiator_a_name} VS ${curr.gladiator_b_name} — Prepara o teu voto!`,
        duration: 7000,
      });
    }
    // Batalha começou (status active)
    else if (prev?.status !== "active" && curr.status === "active") {
      push({
        type:    "battle_start",
        emoji:   "🎤",
        title:   "BATALHA EM CURSO",
        message: `${curr.gladiator_a_name} VS ${curr.gladiator_b_name} · Round ${curr.current_round}`,
        duration: 6000,
      });
    }
    // Mudança de round
    else if (
      curr.status === "active" &&
      prev?.current_round !== curr.current_round &&
      curr.current_round !== undefined
    ) {
      const msgs: Record<number, string> = {
        2: "Round 2 começou! A batalha aquece.",
        3: "🔥 ROUND FINAL! Reações agora activas — vota já!",
      };
      push({
        type:    "round_change",
        emoji:   curr.current_round === 3 ? "🔥" : "⚡",
        title:   `ROUND ${curr.current_round} / 3`,
        message: msgs[curr.current_round] ?? `Round ${curr.current_round} em curso`,
        duration: curr.current_round === 3 ? 8000 : 5000,
      });
    }
    // Julgamento começou
    else if (prev?.status !== "judging" && curr.status === "judging") {
      push({
        type:    "judging",
        emoji:   "⚖️",
        title:   "JULGAMENTO EM CURSO",
        message: "A IA analisa os dados... O veredito chegará em breve.",
        duration: 7000,
      });
    }
    // Vencedor anunciado
    else if (prev?.status !== "finished" && curr.status === "finished" && curr.winner) {
      push({
        type:    "winner",
        emoji:   "🏆",
        title:   "VEREDITO FINAL",
        message: `${curr.winner} é o vencedor desta batalha!`,
        duration: 10000,
      });
    }

    prevRef.current = { ...curr };
  }, [battle, push]);
};
