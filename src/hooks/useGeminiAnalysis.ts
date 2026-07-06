import { useState, useCallback } from "react";
import type { AIScores } from "@/lib/battleScoring";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are the Supreme Judge of a rap battle. Analyze this rap performance and score each criterion from 60 to 98 (60 = weak, 98 = legendary).

CRITERIA:
- Rimas: complexity, creativity, density of rhyme schemes
- Punchlines: impact, wit, effectiveness of punchlines
- Flow: rhythm, cadence, delivery smoothness
- Criatividade: originality, wordplay, metaphors
- Agressividade: aggression, intensity, stage presence

Return ONLY a valid JSON object (no markdown, no extra text):
{"Rimas":<60-98>,"Punchlines":<60-98>,"Flow":<60-98>,"Criatividade":<60-98>,"Agressividade":<60-98>}`;

export const useGeminiAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const analyzeAudio = useCallback(async (audioBlob: Blob): Promise<AIScores | null> => {
    if (!API_KEY) {
      console.error("[Gemini] Missing VITE_GEMINI_API_KEY");
      return null;
    }

    setIsAnalyzing(true);
    try {
      const base64 = await blobToBase64(audioBlob);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: SYSTEM_PROMPT },
                { inlineData: { mimeType: audioBlob.type || "audio/webm", data: base64 } },
              ],
            }],
          }),
        },
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const scores: AIScores = JSON.parse(cleaned);

      const keys: (keyof AIScores)[] = ["Rimas", "Punchlines", "Flow", "Criatividade", "Agressividade"];
      for (const k of keys) {
        if (typeof scores[k] !== "number" || scores[k] < 60 || scores[k] > 98) {
          throw new Error(`Invalid score for ${k}: ${scores[k]}`);
        }
      }

      return scores;
    } catch (err) {
      console.error("[Gemini] Analysis error:", err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeAudio, isAnalyzing };
};
