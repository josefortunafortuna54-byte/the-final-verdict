import { Music, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface MusicControlProps {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}

export const MusicControl = ({
  isPlaying,
  isLoading,
  volume,
  onToggle,
  onVolumeChange,
}: MusicControlProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        disabled={isLoading}
        className="h-10 w-10 rounded-full hover:bg-primary/20"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : isPlaying ? (
          <Music className="h-5 w-5 text-primary animate-pulse" />
        ) : (
          <Music className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {isPlaying && (
        <div className="flex items-center gap-2 animate-fade-in">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={(value) => onVolumeChange(value[0] / 100)}
            className="w-20"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {isLoading && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Gerando música épica...
        </span>
      )}
    </div>
  );
};
