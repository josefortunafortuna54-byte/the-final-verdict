import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, Bell, BellOff } from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Entrada
    const t1 = setTimeout(() => setVisible(true), 10);
    // Saída animada ligeiramente antes do dismiss real
    const dur = notification.duration ?? 6000;
    const t2 = setTimeout(() => setLeaving(true), dur - 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [notification.duration]);

  const typeStyles: Record<Notification["type"], string> = {
    battle_start: "border-primary/60 bg-primary/10",
    round_change: "border-yellow-500/50 bg-yellow-500/8",
    judging:      "border-purple-500/50 bg-purple-500/8",
    winner:       "border-primary/80 bg-primary/15 shadow-[0_0_20px_hsl(var(--arena-glow)/0.3)]",
    info:         "border-border/50 bg-card/40",
  };

  return (
    <div
      className={cn(
        "relative w-full border-l-4 px-4 py-3 transition-all duration-300 overflow-hidden",
        typeStyles[notification.type],
        visible && !leaving ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      )}
      style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-primary/50 origin-left"
        style={{
          animation: `shrink ${notification.duration ?? 6000}ms linear forwards`,
        }}
      />

      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{notification.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xs tracking-[0.15em] text-primary mb-0.5">
            {notification.title}
          </p>
          <p className="font-body text-xs text-muted-foreground/80 leading-relaxed">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

/* ── Container de notificações ────────────────────────────────────────── */
interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onDismiss }: NotificationContainerProps) => {
  if (!notifications.length) return null;
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-72 max-w-[calc(100vw-2rem)]">
      {notifications.map((n) => (
        <NotificationToast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

/* ── Botão de permissão de notificações ───────────────────────────────── */
interface NotificationPermissionBtnProps {
  permission: NotificationPermission;
  onRequest: () => void;
}

export const NotificationPermissionBtn = ({
  permission,
  onRequest,
}: NotificationPermissionBtnProps) => {
  if (permission === "granted" || !("Notification" in window)) return null;

  return (
    <button
      onClick={onRequest}
      className={cn(
        "flex items-center gap-2 px-3 py-2 w-full border transition-colors",
        permission === "denied"
          ? "border-muted-foreground/20 text-muted-foreground/40 cursor-not-allowed"
          : "border-primary/30 bg-primary/5 text-primary/80 hover:bg-primary/10"
      )}
      disabled={permission === "denied"}
    >
      {permission === "denied"
        ? <BellOff className="w-4 h-4 shrink-0" />
        : <Bell className="w-4 h-4 shrink-0 animate-pulse" />
      }
      <div className="text-left">
        <p className="mono-label-sm">
          {permission === "denied" ? "NOTIFICAÇÕES BLOQUEADAS" : "ACTIVAR NOTIFICAÇÕES"}
        </p>
        <p className="text-xs text-muted-foreground/50 font-body">
          {permission === "denied"
            ? "Permite nas definições do browser"
            : "Recebe alertas quando a batalha muda"
          }
        </p>
      </div>
    </button>
  );
};
