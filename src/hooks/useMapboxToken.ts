import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cached: string | null = null;

export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    supabase.functions
      .invoke("get-mapbox-token")
      .then(({ data, error }) => {
        if (!error && data?.token) {
          cached = data.token;
          setToken(data.token);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { token, loading };
}
