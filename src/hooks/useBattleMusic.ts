import { useState, useRef, useCallback, useEffect } from "react";

// ── Música de arena sintetizada via Web Audio API ─────────────────────────
// Drone épico com baixo pulsante, percussão e harmónicos — sem dependências externas

const buildArenaMusic = (ctx: AudioContext, vol: number): (() => void) => {
  const master = ctx.createGain();
  master.gain.value = vol;
  master.connect(ctx.destination);

  const nodes: AudioNode[] = [];
  const now = ctx.currentTime;

  // ── Drone de baixo (fundamentais) ─────────────────────────────────────
  const drones = [
    { freq: 55,  gain: 0.30, type: "sine"     as OscillatorType },
    { freq: 82,  gain: 0.18, type: "triangle" as OscillatorType },
    { freq: 110, gain: 0.12, type: "sine"     as OscillatorType },
    { freq: 165, gain: 0.07, type: "triangle" as OscillatorType },
  ];
  drones.forEach(({ freq, gain, type }) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // Vibrato lento
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.4 + Math.random() * 0.2;
    lfoG.gain.value = freq * 0.008;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);
    lfo.start();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 3.0);
    osc.connect(g); g.connect(master);
    osc.start(); nodes.push(osc, g, lfo, lfoG);
  });

  // ── Tensão — noise filtrado (textura) ─────────────────────────────────
  const bufSize = ctx.sampleRate * 4;
  const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop   = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type            = "bandpass";
  noiseFilter.frequency.value = 180;
  noiseFilter.Q.value         = 0.3;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.04, now + 5.0);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start();
  nodes.push(noise, noiseFilter, noiseGain);

  // ── Pulsação rítmica (bombo a cada 2s) ─────────────────────────────────
  const scheduleKick = () => {
    const kickOsc  = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.frequency.setValueAtTime(90, ctx.currentTime);
    kickOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
    kickGain.gain.setValueAtTime(0.7, ctx.currentTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    kickOsc.connect(kickGain); kickGain.connect(master);
    kickOsc.start(); kickOsc.stop(ctx.currentTime + 0.3);
  };
  const kickInterval = setInterval(scheduleKick, 2000);

  // Retorna função de cleanup
  return () => {
    clearInterval(kickInterval);
    nodes.forEach((n) => {
      try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* node may already be stopped */ }
      try { n.disconnect(); } catch { /* node may already be disconnected */ }
    });
    master.disconnect();
  };
};

// ── Hook ─────────────────────────────────────────────────────────────────
export const useBattleMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState]  = useState(0.3);
  const ctxRef     = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const volRef     = useRef(0.3);

  const startMusic = useCallback(() => {
    if (isPlaying || isLoading) return;
    setIsLoading(true);

    try {
      // Fecha contexto anterior se existir
      if (ctxRef.current) {
        cleanupRef.current?.();
        ctxRef.current.close();
      }

      const ACtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new ACtx();
      ctxRef.current = ctx;

      const cleanup = buildArenaMusic(ctx, volRef.current);
      cleanupRef.current = cleanup;

      setIsPlaying(true);
    } catch (err) {
      console.error("Music start failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, isLoading]);

  const stopMusic = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggleMusic = useCallback(() => {
    if (isPlaying) stopMusic();
    else startMusic();
  }, [isPlaying, startMusic, stopMusic]);

  const changeVolume = useCallback((v: number) => {
    volRef.current = v;
    setVolumeState(v);
    // Ajusta ganho master em tempo real se estiver a tocar
    if (ctxRef.current) {
      const master = ctxRef.current.destination;
      // Recria com novo volume — mais simples e confiável
      if (isPlaying) {
        stopMusic();
        setTimeout(startMusic, 100);
      }
    }
  }, [isPlaying, stopMusic, startMusic]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      ctxRef.current?.close();
    };
  }, []);

  return { isPlaying, isLoading, volume, toggleMusic, stopMusic, changeVolume };
};
