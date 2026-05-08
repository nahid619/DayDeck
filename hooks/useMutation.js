// hooks/useMutation.js
"use client";
import { useState, useCallback } from "react";

/**
 * Mutation hook for POST / PUT / DELETE requests.
 * Returns { mutate, loading, error, reset }.
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation();
 *   await mutate("/api/cards", "POST", payload);
 */
export default function useMutation() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (url, method = "POST", body = null) => {
    setLoading(true);
    setError(null);
    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body !== null) options.body = JSON.stringify(body);

      const res  = await fetch(url, options);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Request failed");
      return json.data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { mutate, loading, error, reset };
}
