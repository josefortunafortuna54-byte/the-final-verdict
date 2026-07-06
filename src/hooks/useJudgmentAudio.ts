import { useState, useCallback, useRef, useEffect } from "react";

// ── Seleccionar melhor voz disponível ─────────────────────────────────────
const MALE_KEYWORDS = [
  "daniel", "diego", "carlos", "miguel", "antonio", "paulo", "jorge",
  "luciano", "reed", "luca", "damian", "eddy", "thomas", "alex",
  "male", "masculin", "homem", "man", "brasil", "brazil",
  "google português", "google pt",
];

let cachedVoice: SpeechSynthesisVoice | null = null;

const getBestVoice = (): SpeechSynthesisVoice | null => {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const checks = [
    (v: SpeechSynthesisVoice) => /pt[-_](br|BR)/i.test(v.lang) && MALE_KEYWORDS.some(k => v.name.toLowerCase().includes(k)),
    (v: SpeechSynthesisVoice) => /pt[-_](pt|PT)/i.test(v.lang) && MALE_KEYWORDS.some(k => v.name.toLowerCase().includes(k)),
    (v: SpeechSynthesisVoice) => /^pt/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /^en/i.test(v.lang) && MALE_KEYWORDS.some(k => v.name.toLowerCase().includes(k)),
    () => true,
  ];

  for (const check of checks) {
    const match = voices.find(check);
    if (match) {
      console.log("[TTS] Voz:", match.name, match.lang);
      cachedVoice = match;
      return match;
    }
  }
  return voices[0] ?? null;
};

// ── Aguardar vozes (com cache para não bloquear entre frases) ─────────────
let voicesReady = false;
const ensureVoices = (): Promise<void> =>
  new Promise((resolve) => {
    if (voicesReady || window.speechSynthesis.getVoices().length > 0) {
      voicesReady = true;
      resolve();
      return;
    }
    const onReady = () => {
      voicesReady = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onReady);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onReady);
    setTimeout(() => { voicesReady = true; resolve(); }, 2500);
  });

// ── Falar UMA frase e resolver quando termina ─────────────────────────────
// Sem cancel() interno — o caller é responsável por não sobrepor frases.
// Implementa workaround para o bug do Chrome (TTS para após ~15s).
const speakOne = (
  text: string,
  opts: { rate?: number; pitch?: number; volume?: number; pauseAfter?: number } = {}
): Promise<void> => {
  return new Promise((resolve) => {
    const { rate = 0.76, pitch = 0.5, volume = 1, pauseAfter = 250 } = opts;

    const utter = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice();
    if (voice) utter.voice = voice;
    utter.rate   = rate;
    utter.pitch  = pitch;
    utter.volume = volume;
    utter.lang   = voice?.lang ?? "pt-BR";

    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      clearInterval(keepAlive);
      setTimeout(resolve, pauseAfter);
    };

    utter.onend   = done;
    utter.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        // Cancelamento intencional — resolve imediatamente
        if (!resolved) { resolved = true; clearInterval(keepAlive); resolve(); }
        return;
      }
      console.warn("[TTS] Erro:", e.error, text.slice(0, 40));
      done();
    };

    // Workaround Chrome bug: resume a cada 10s para evitar que pare
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10000);

    window.speechSynthesis.speak(utter);
  });
};

// ── Hook principal ────────────────────────────────────────────────────────
export const useJudgmentAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef   = useRef(false);
  const initDone   = useRef(false);

  // Pré-carrega vozes quando o hook monta
  useEffect(() => {
    if (!initDone.current) {
      initDone.current = true;
      ensureVoices();
    }
  }, []);

  // ── playPhrase ─────────────────────────────────────────────────────────
  // Diz UMA frase e aguarda. Usado pela sequência do overlay.
  const playPhrase = useCallback(async (text: string, _tone = "serious") => {
    abortRef.current = false;
    setIsPlaying(true);

    // Só espera por vozes na primeira chamada (já deve estar pronto)
    if (!voicesReady) {
      setIsLoading(true);
      await ensureVoices();
      setIsLoading(false);
    }

    if (abortRef.current) { setIsPlaying(false); return; }

    await speakOne(text, {
      rate:       _tone === "serious" ? 0.60 : 0.90,
      pitch:      0.4,
      pauseAfter: _tone === "serious" ? 300 : 150,
    });

    if (!abortRef.current) setIsPlaying(false);
  }, []);

  // ── playAnnouncement ──────────────────────────────────────────────────
  // Sequência completa de anúncio do vencedor.
  const playAnnouncement = useCallback(async (winnerName: string) => {
    abortRef.current = false;
    setIsPlaying(true);

    if (!voicesReady) {
      setIsLoading(true);
      await ensureVoices();
      setIsLoading(false);
    }

    if (abortRef.current) { setIsPlaying(false); return; }

    const jokes = [
      "E o perdedor? Pelo menos ganhou experiência. E cicatrizes. Muitas cicatrizes.",
      "Dizem que o perdedor ainda está a tentar perceber o que aconteceu. Spoiler: perdeu.",
      "O perdedor pediu uma revanche. A arena respondeu com silêncio.",
      "Alguns dizem que o perdedor era bom. A arena discordou.",
      "A mãe do perdedor ainda acha que ele é campeão. Mães são assim.",
      "O perdedor disse que deixou ganhar. Claro que acreditamos.",
      "O perdedor vai precisar de muita água para engolir esta derrota.",
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];

    // Nome — muito lento e grave para máximo impacto
    await speakOne(winnerName + "!", { rate: 0.40, pitch: 0.35, pauseAfter: 900 });
    if (abortRef.current) { setIsPlaying(false); return; }

    await speakOne("A palavra cortou. A arena decidiu.", { rate: 0.70, pitch: 0.5, pauseAfter: 1000 });
    if (abortRef.current) { setIsPlaying(false); return; }

    await speakOne(joke, { rate: 0.84, pitch: 0.55, pauseAfter: 300 });

    setIsPlaying(false);
  }, []);

  // ── stopAudio ─────────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    abortRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  return { playAnnouncement, playPhrase, stopAudio, isPlaying, isLoading };
};
