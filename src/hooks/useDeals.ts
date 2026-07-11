import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { evaluateBillingAccess, type BillingProfile } from "@/lib/billingAccess";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export function useDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useDealFileUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deal-file-usage", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("deal_file_usage")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

export function useCreateDeal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal: Omit<TablesInsert<"deals">, "user_id">) => {
      if (!user) throw new Error("Not authenticated");

      const { count: lifetimeDealCount } = await supabase
        .from("deal_file_usage")
        .select("*", { count: "exact", head: true });

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_status, free_deal_used, admin_override, manual_premium_override, stripe_customer_id, stripe_subscription_id")
        .eq("id", user.id)
        .single();
      if (profileError) throw profileError;

      const access = evaluateBillingAccess(profile as BillingProfile, lifetimeDealCount ?? 0);
      if (!access.canCreateDeal) {
        throw new Error(access.reason);
      }

      const { data, error } = await supabase
        .from("deals")
        .insert({ ...deal, user_id: user.id })
        .select()
        .single();
      if (error) throw error;

      if (lifetimeDealCount === 0 || lifetimeDealCount === null) {
        await supabase
          .from("profiles")
          .update({ free_deal_used: true })
          .eq("id", user.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal-file-usage"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating deal", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast({ title: "Deal deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting deal", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeal(dealId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", dealId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!dealId,
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"deals"> & { id: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal", data.id] });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating deal", description: error.message, variant: "destructive" });
    },
  });
}
