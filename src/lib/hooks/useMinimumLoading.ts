"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const DEFAULT_MIN_TIME = 0; // Default to instant transition (no artificial delay)

export function useMinimumLoading(initialState = true, minTime = DEFAULT_MIN_TIME) {
  const [isLoading, setIsLoading] = useState(initialState);
  const startTimeRef = useRef<number>(typeof window !== "undefined" ? performance.now() : Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = typeof window !== "undefined" ? performance.now() : Date.now();
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(
    (onComplete?: () => void) => {
      if (minTime <= 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsLoading(false);
        if (onComplete) onComplete();
        return;
      }

      const now = typeof window !== "undefined" ? performance.now() : Date.now();
      const elapsed = now - startTimeRef.current;
      const remainingDelay = Math.max(0, minTime - elapsed);

      if (remainingDelay > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsLoading(false);
          timerRef.current = null;
          if (onComplete) onComplete();
        }, remainingDelay);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsLoading(false);
        if (onComplete) onComplete();
      }
    },
    [minTime]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { isLoading, startLoading, stopLoading, setIsLoading };
}
