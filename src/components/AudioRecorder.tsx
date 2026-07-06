import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Button } from "@/components/ui/button";
import { Mic, Square, CheckCircle2, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  gladiatorName: string;
  side: "a" | "b";
  disabled?: boolean;
  onRecordingComplete: (side: "a" | "b", blob: Blob) => void;
  className?: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const AudioRecorder = ({
  gladiatorName,
  side,
  disabled = false,
  onRecordingComplete,
  className,
}: AudioRecorderProps) => {
  const {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch {
        // Permissão negada — o utilizador vê o erro do browser
      }
    }
  };

  if (audioBlob) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <span className="mono-label-sm text-muted-foreground truncate">
          {gladiatorName} — {formatTime(duration)}
        </span>
      </div>
    );
  }

  if (disabled && !isRecording) {
    return (
      <div className={cn("flex items-center gap-3 opacity-40", className)}>
        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="mono-label-sm text-muted-foreground truncate">
          {gladiatorName} — aguardando
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button
        variant={isRecording ? "destructive" : "arena"}
        size="sm"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "gap-2 transition-all duration-300",
          isRecording && "animate-pulse shadow-[0_0_20px_hsl(var(--destructive)/0.5)]",
        )}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4" />
            PARAR
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            GRAVAR
          </>
        )}
      </Button>

      {isRecording && (
        <span className="flex items-center gap-1.5 mono-label-sm text-destructive">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(duration)}
        </span>
      )}
    </div>
  );
};

export default AudioRecorder;
