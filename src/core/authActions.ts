import { invokeBrixFunction } from "./supabase";

export type AccountDeletionRequestResult = {
  ok: boolean;
  requestId: string | null;
  status: "requested" | "processing" | "completed" | "rejected" | "failed";
  requestedAt: string | null;
};

export async function requestAccountDeletion() {
  return invokeBrixFunction<AccountDeletionRequestResult>("request-account-deletion", {});
}
