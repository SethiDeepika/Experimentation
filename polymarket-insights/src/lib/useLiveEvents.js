import { useCallback, useEffect, useRef, useState } from "react";

export const REFRESH_MS = 60_000;

/**
 * Loads events with `load()` and re-polls every REFRESH_MS while the tab is visible.
 * If the very first load fails, falls back to `fallback()` (sample data) so the
 * page still demonstrates the analysis; later failures keep the last good data.
 */
export default function useLiveEvents(load, fallback, deps) {
  const [state, setState] = useState({ events: [], source: null, error: null, updatedAt: null });
  const [loading, setLoading] = useState(true);
  const hasLive = useRef(false);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const events = await load();
      if (mine !== seq.current) return;
      hasLive.current = true;
      setState({ events, source: "live", error: null, updatedAt: Date.now() });
    } catch (err) {
      if (mine !== seq.current) return;
      console.warn("Polymarket fetch failed:", err);
      setState((s) =>
        hasLive.current
          ? { ...s, error: err }
          : { events: fallback(), source: "demo", error: err, updatedAt: Date.now() }
      );
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    hasLive.current = false;
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Re-render the "Updated Xs ago" label.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  return { ...state, loading, refresh };
}
