"use client";

import { useEffect, useState } from "react";

const KEY = "fn_anonymous_token_v1";

export function useAnonymousToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- anonymous id must bootstrap from localStorage client-side */
    try {
      const existing = window.localStorage.getItem(KEY);
      if (existing) {
        setToken(existing);
        return;
      }
      const next =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `fn_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(KEY, next);
      setToken(next);
    } catch {
      setToken(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return token;
}
