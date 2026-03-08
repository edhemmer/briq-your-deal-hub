import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { TablesInsert } from "@/integrations/supabase/types";

const MAX_DEALS = 15;

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

export function useCreateDeal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal: Omit<TablesInsert<"deals">, "user_id">) => {
      if (!user) throw new Error("Not authenticated");

      // Enforce 15-deal limit: delete oldest if at limit
      const { count } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true });

      if (count !== null && count >= MAX_DEALS) {
        const { data: oldest } = await supabase
          .from("deals")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1);
        if (oldest && oldest.length > 0) {
          await supabase.from("deals").delete().eq("id", oldest[0].id);
        }
      }

      const { data, error } = await supabase
        .from("deals")
        .insert({ ...deal, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
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
