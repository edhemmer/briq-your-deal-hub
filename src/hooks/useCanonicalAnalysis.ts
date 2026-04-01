/**
 * BRIQ v1.6.0 — Reactive Canonical Analysis Hook
 *
 * Wraps runCanonicalAnalysis with:
 *  - Debounced execution (300ms) so rapid input edits don't thrash
 *  - Concurrency guard: only the latest input wins
 *  - Dirty/fresh state tracking for UI synchronization
 *  - Atomic output updates (all-or-nothing) to prevent partial renders
 *  - v1.6.0: AnalysisContext support for profile-driven routing
 *
 * Pure orchestration — no formula or data-source changes.
 */

import { useState, useEffect, useRef } from "react";
import type { NormalizedDealState } from "@/lib/normalizedDealState";
import type { AnalysisContext } from "@/lib/marketProfiles";
import { runCanonicalAnalysis, type CanonicalAnalysisOutput } from "@/lib/canonicalEngineLayer";

export type AnalysisStatus = "idle" | "dirty" | "analyzing" | "fresh";

export interface UseCanonicalAnalysisResult {
  output: CanonicalAnalysisOutput | null;
  status: AnalysisStatus;
}

const DEBOUNCE_MS = 300;

export function useCanonicalAnalysis(
  state: NormalizedDealState | null,
  context?: AnalysisContext | null
): UseCanonicalAnalysisResult {
  const [output, setOutput] = useState<CanonicalAnalysisOutput | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");

  const generationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<NormalizedDealState | null>(null);
  const lastContextRef = useRef<AnalysisContext | null | undefined>(null);

  useEffect(() => {
    if (!state) {
      if (timerRef.current) clearTimeout(timerRef.current);
      generationRef.current += 1;
      setOutput(null);
      setStatus("idle");
      lastStateRef.current = null;
      lastContextRef.current = null;
      return;
    }

    // Skip if identical refs
    if (state === lastStateRef.current && context === lastContextRef.current) return;

    setStatus("dirty");

    if (timerRef.current) clearTimeout(timerRef.current);

    const gen = ++generationRef.current;

    timerRef.current = setTimeout(() => {
      if (gen !== generationRef.current) return;

      setStatus("analyzing");

      const result = runCanonicalAnalysis(state, context ?? undefined);

      if (gen === generationRef.current) {
        lastStateRef.current = state;
        lastContextRef.current = context;
        setOutput(result);
        setStatus("fresh");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, context]);

  return { output, status };
}
