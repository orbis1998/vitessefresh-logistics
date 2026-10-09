import { supabase } from "@/integrations/supabase/client";

import { HOME_BY_ROLE, fromVitaRole, pickPrimaryRole, type AppRole } from "@/lib/roles";

export const getPostAuthPath = (roles: string[]) => {
  const primary = pickPrimaryRole(roles as AppRole[]);
  return HOME_BY_ROLE[primary ?? "client"];
};

export const fetchMyRoles = async () => {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) return [];
  const { data } = await supabase.from("users").select("role").eq("id", uid).maybeSingle();
  if (data?.role) return [fromVitaRole(String(data.role))];
  return ["client"];
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  return error;
};
