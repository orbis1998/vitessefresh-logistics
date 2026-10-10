import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cached: string | null = null;
let inflight: Promise<string | null> | null = null;

async function loadToken() {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase.functions.invoke("get-mapbox-token");
    const token =
      (data as { token?: string } | null)?.token ||
      (typeof data === "string" ? data : null);
    if (!error && token) {
      cached = token;
      return token;
    }
    return null;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) {
      setToken(cached);
      setLoading(false);
      return;
    }
    loadToken()
      .then((t) => setToken(t))
      .finally(() => setLoading(false));
  }, []);

  return { token, loading };
}
