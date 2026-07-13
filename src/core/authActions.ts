import { invokeBrixFunction } from "./supabase";

export async function requestAccountDeletion() {
  return invokeBrixFunction<{ ok: boolean }>("request-account-deletion", {});
}
