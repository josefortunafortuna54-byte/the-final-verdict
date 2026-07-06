import { useCallback, useRef } from "react";

type SFXType = "round_start" | "round_end" | "judgment" | "winner" | "reaction" | "tension";

// ── Gera sons dramáticos via Web Audio API ─────────────────────────────────
const ACtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
const createAudioContext = () => new ACtx();

const playSFXSound = async (type: SFXType, volume = 0.6) => {
  const ctx = createAudioContext();
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case "round_start": {
      // Corneta épica de arena — onda sawtooth com reverb
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g1   = ctx.createGain();
      const g2   = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.3);
      osc1.frequency.exponentialRampToValueAtTime(185, now + 0.8);

      osc2.frequency.setValueAtTime(165, now);
      osc2.frequency.exponentialRampToValueAtTime(330, now + 0.3);

      g1.gain.setValueAtTime(0.7, now);
      g1.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      g2.gain.setValueAtTime(0.4, now);
      g2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      osc1.connect(g1); g1.connect(master);
      osc2.connect(g2); g2.connect(master);
      osc1.start(now); osc1.stop(now + 1.5);
      osc2.start(now); osc2.stop(now + 1.2);

      // Drum hit
      const noise = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      noise.type = "sine";
      noise.frequency.setValueAtTime(80, now);
      noise.frequency.exponentialRampToValueAtTime(20, now + 0.3);
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      noise.connect(noiseGain); noiseGain.connect(master);
      noise.start(now); noise.stop(now + 0.3);
      break;
    }

    case "round_end": {
      // Gongo profundo
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();

      // Distorção suave para textura
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;

      osc.type = "sine";
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 2.5);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

      osc.connect(dist); dist.connect(gain); gain.connect(master);
      osc.start(now); osc.stop(now + 3.0);

      // Harmónico superior
      const osc2 = ctx.createOscillator();
      const g2   = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(110, now);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 2.0);
      g2.gain.setValueAtTime(0.4, now);
      g2.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
      osc2.connect(g2); g2.connect(master);
      osc2.start(now); osc2.stop(now + 2.0);
      break;
    }

    case "judgment": {
      // Coro sombrio crescente
      const freqs = [55, 82, 110, 138, 165];
      freqs.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.001, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.15 + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
        osc.connect(gain); gain.connect(master);
        osc.start(now + i * 0.15);
        osc.stop(now + 4.5);
      });
      break;
    }

    case "winner": {
      // Fanfarra triunfante
      const melody = [
        { freq: 262, start: 0,    dur: 0.15 },
        { freq: 330, start: 0.15, dur: 0.15 },
        { freq: 392, start: 0.30, dur: 0.15 },
        { freq: 523, start: 0.45, dur: 0.5  },
        { freq: 440, start: 0.95, dur: 0.2  },
        { freq: 523, start: 1.15, dur: 0.8  },
      ];
      melody.forEach(({ freq, start, dur }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.5, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain); gain.connect(master);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
      break;
    }

    case "reaction": {
      // Crowd burst — ruído branco filtrado
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data       = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.8, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.start(now); source.stop(now + 0.8);
      break;
    }

    case "tension": {
      // Pulsação de baixo frequência
      const lfo  = ctx.createOscillator();
      const osc  = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain    = ctx.createGain();

      lfo.frequency.value = 1.5;
      lfoGain.gain.value  = 20;
      osc.frequency.value = 55;
      osc.type = "sine";

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.6, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      osc.connect(gain); gain.connect(master);
      lfo.start(now); lfo.stop(now + 4.0);
      osc.start(now); osc.stop(now + 4.0);
      break;
    }
  }

  // Fecha o contexto após o som terminar
  setTimeout(() => ctx.close(), 5000);
};

// ── Hook ──────────────────────────────────────────────────────────────────
export const useBattleSFX = () => {
  const isPlayingRef = useRef(false);

  const playSFX = useCallback(async (type: SFXType, _duration?: number) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    try {
      await playSFXSound(type, 0.6);
    } catch (err) {
      console.error("SFX error:", err);
    } finally {
      setTimeout(() => { isPlayingRef.current = false; }, 500);
    }
  }, []);

  const stopSFX = useCallback(() => {
    isPlayingRef.current = false;
  }, []);

  return { playSFX, stopSFX };
};
