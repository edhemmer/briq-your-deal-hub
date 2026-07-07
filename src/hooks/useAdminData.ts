import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_admin_access", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });
}

export type AdminConsoleUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string | null;
  subscription_status: string | null;
  free_deal_used: boolean | null;
  admin_override: boolean | null;
  manual_premium_override: boolean | null;
  manual_override_note: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  deletion_status: string | null;
  account_status: string | null;
  apple_private_relay_email: boolean | null;
  deal_count: number;
};

export type AdminConsoleOverview = {
  kpis: {
    monthlyPriceCents: number;
    monthlyRecurringRevenueCents: number;
    quarterlyRunRateCents: number;
    totalUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    activeSubscribers: number;
    activePaidUsers: number;
    manualOverrides: number;
    freeUsers: number;
    lockedUsers: number;
    cancellations30d: number;
    totalDeals: number;
    deals30d: number;
    usersWithDeals: number;
    openDeletionRequests: number;
    appleUsers: number;
    stripeConfigured: boolean;
  };
  system?: {
    stripeConfigured: boolean;
    stripeSecretConfigured: boolean;
    stripeWebhookConfigured: boolean;
    stripePriceConfigured: boolean;
  };
  users: AdminConsoleUser[];
  deals: Array<{
    id: string;
    user_id: string;
    property_address: string;
    city: string | null;
    state: string | null;
    created_at: string;
  }>;
  auditLog: Array<{
    id: string;
    admin_user_id: string;
    target_user_id: string | null;
    action_type: string;
    details: unknown;
    created_at: string;
  }>;
  deletionRequests: Array<{
    id: string;
    user_id: string | null;
    status: string;
    requested_at: string;
    completed_at: string | null;
    reason: string | null;
    request_source: string;
  }>;
};

async function invokeAdminConsole<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-console", { body });
  if (error) throw error;
  const payload = data as T & { error?: string };
  if (payload?.error) throw new Error(payload.error);
  return payload as T;
}

export function useAdminConsoleOverview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-console-overview"],
    queryFn: () => invokeAdminConsole<AdminConsoleOverview>({ action: "overview" }),
    enabled: !!user,
  });
}

export function useAdminConsoleAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) => invokeAdminConsole<{ ok: boolean }>(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-console-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
    },
  });
}

export function useAdminUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAdminDeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, property_address, city, state, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAdminAuditLog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAdminUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      updates,
      actionType,
    }: {
      targetUserId: string;
      updates: Record<string, unknown>;
      actionType: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", targetUserId);
      if (error) throw error;

      // Log audit
      await supabase.from("admin_audit_log").insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        action_type: actionType,
        details: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
    },
  });
}
