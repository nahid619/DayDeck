// hooks/useFetch.js — Issue 22: abort controller prevents race conditions
"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export default function useFetch(url) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const lastFetch             = useRef(0);
  const abortRef              = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!url) return;
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller   = new AbortController();
    abortRef.current   = controller;

    if (!silent) setLoading(true);
    try {
      const res  = await fetch(url, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json.data);
      setError(null);
    } catch (e) {
      if (e.name === "AbortError") return; // intentional cancel — ignore
      setError(e.message);
    } finally {
      if (!controller.signal.aborted && !silent) setLoading(false);
      else if (!controller.signal.aborted) setLoading(false);
    }
    lastFetch.current = Date.now();
  }, [url]);

  useEffect(() => {
    fetchData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchData]);

  // Re-fetch silently on tab focus (3s debounce)
  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastFetch.current < 3000) return;
      fetchData(true);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData() };
}
