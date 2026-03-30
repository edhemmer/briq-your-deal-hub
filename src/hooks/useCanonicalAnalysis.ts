/**
 * BRIQ v1.5.4 — Reactive Canonical Analysis Hook
 *
 * Wraps runCanonicalAnalysis with:
 *  - Debounced execution (300ms) so rapid input edits don't thrash
 *  - Concurrency guard: only the latest input wins
 *  - Dirty/fresh state tracking for UI synchronization
 *  - Atomic output updates (all-or-nothing) to prevent partial renders
 *
 * Pure orchestration — no formula or data-source changes.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { NormalizedDealState } from "@/lib/normalizedDealState";
import { runCanonicalAnalysis, type CanonicalAnalysisOutput } from "@/lib/canonicalEngineLayer";

export type AnalysisStatus = "idle" | "dirty" | "analyzing" | "fresh";

export interface UseCanonicalAnalysisResult {
  output: CanonicalAnalysisOutput | null;
  status: AnalysisStatus;
}

const DEBOUNCE_MS = 300;

export function useCanonicalAnalysis(
  state: NormalizedDealState | null
): UseCanonicalAnalysisResult {
  const [output, setOutput] = useState<CanonicalAnalysisOutput | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");

  // Generation counter for concurrency: only the latest run may commit output.
  const generationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the last-computed state identity to skip duplicate runs.
  const lastStateRef = useRef<NormalizedDealState | null>(null);

  useEffect(() => {
    // Null state → clear everything
    if (!state) {
      if (timerRef.current) clearTimeout(timerRef.current);
      generationRef.current += 1;
      setOutput(null);
      setStatus("idle");
      lastStateRef.current = null;
      return;
    }

    // If the reference is identical (same useMemo result), skip.
    if (state === lastStateRef.current) return;

    // Mark dirty immediately so UI knows inputs changed.
    setStatus("dirty");

    // Clear any pending debounce timer.
    if (timerRef.current) clearTimeout(timerRef.current);

    // Increment generation so any in-flight older run is discarded.
    const gen = ++generationRef.current;

    timerRef.current = setTimeout(() => {
      // Double-check this is still the latest generation.
      if (gen !== generationRef.current) return;

      setStatus("analyzing");

      // runCanonicalAnalysis is synchronous & pure — safe to call inline.
      const result = runCanonicalAnalysis(state);

      // Only commit if still the latest generation (guards against rapid succession).
      if (gen === generationRef.current) {
        lastStateRef.current = state;
        setOutput(result);
        setStatus("fresh");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  return { output, status };
}
