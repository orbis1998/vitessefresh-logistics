import { supabase } from "@/integrations/supabase/client";

import { HOME_BY_ROLE, pickPrimaryRole, type AppRole } from "@/lib/roles";

export const getPostAuthPath = (roles: string[]) => {
  const primary = pickPrimaryRole(roles as AppRole[]);
  return HOME_BY_ROLE[primary ?? "client"];
};

export const fetchMyRoles = async () => {
  let roles: string[] = [];
  for (let i = 0; i < 4; i++) {
    const { data, error } = await supabase.rpc("get_my_roles");
    if (!error && data) {
      roles = data.map((r: { role: string }) => r.role);
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return roles;
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
