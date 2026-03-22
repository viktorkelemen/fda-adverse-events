import { useEffect, useRef, useState } from "react";
import { fetchDrugSuggestions } from "../rxnorm";

const MAX_CACHE_SIZE = 200;
const cache = new Map<string, string[]>();

export function useDrugSuggestions(term: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = term.trim().toLowerCase();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (cache.has(trimmed)) {
      setSuggestions(cache.get(trimmed)!);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      fetchDrugSuggestions(trimmed, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            if (cache.size >= MAX_CACHE_SIZE) {
              cache.delete(cache.keys().next().value!);
            }
            cache.set(trimmed, results);
            setSuggestions(results);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      abortRef.current?.abort();
    };
  }, [term]);

  return { suggestions, loading };
}
