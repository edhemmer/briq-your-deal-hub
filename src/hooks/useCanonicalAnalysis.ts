/**
 * BRIX v1.6.1 — Reactive Canonical Analysis Hook
 *
 * Wraps runCanonicalAnalysis with debounced execution, concurrency guard,
 * and source quality awareness.
 */

import { useState, useEffect, useRef } from "react";
import type { NormalizedDealState } from "@/lib/normalizedDealState";
import type { AnalysisContext } from "@/lib/marketProfiles";
import type { SourceQualityInput } from "@/lib/confidenceEngine";
import { runCanonicalAnalysis, type CanonicalAnalysisOutput } from "@/lib/canonicalEngineLayer";

export type AnalysisStatus = "idle" | "dirty" | "analyzing" | "fresh";

export interface UseCanonicalAnalysisResult {
  output: CanonicalAnalysisOutput | null;
  status: AnalysisStatus;
}

const DEBOUNCE_MS = 300;

export function useCanonicalAnalysis(
  state: NormalizedDealState | null,
  context?: AnalysisContext | null,
  sourceQuality?: SourceQualityInput | null
): UseCanonicalAnalysisResult {
  const [output, setOutput] = useState<CanonicalAnalysisOutput | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");

  const generationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<NormalizedDealState | null>(null);
  const lastContextRef = useRef<AnalysisContext | null | undefined>(null);
  const lastSourceQualityRef = useRef<SourceQualityInput | null | undefined>(null);

  useEffect(() => {
    if (!state) {
      if (timerRef.current) clearTimeout(timerRef.current);
      generationRef.current += 1;
      setOutput(null);
      setStatus("idle");
      lastStateRef.current = null;
      lastContextRef.current = null;
      lastSourceQualityRef.current = null;
      return;
    }

    if (state === lastStateRef.current && context === lastContextRef.current && sourceQuality === lastSourceQualityRef.current) return;

    setStatus("dirty");

    if (timerRef.current) clearTimeout(timerRef.current);

    const gen = ++generationRef.current;

    timerRef.current = setTimeout(() => {
      if (gen !== generationRef.current) return;

      setStatus("analyzing");

      const result = runCanonicalAnalysis(state, context ?? undefined, sourceQuality ?? undefined);

      if (gen === generationRef.current) {
        lastStateRef.current = state;
        lastContextRef.current = context;
        lastSourceQualityRef.current = sourceQuality;
        setOutput(result);
        setStatus("fresh");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, context, sourceQuality]);

  return { output, status };
}
