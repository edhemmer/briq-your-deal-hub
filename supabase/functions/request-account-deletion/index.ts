import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeletionRequestBody = {
  reason?: string;
  source?: "ios" | "web" | "admin";
  confirmDeletion?: boolean;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Supabase environment is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as DeletionRequestBody;
    const user = userData.user;
    const provider = user.app_metadata?.provider ?? "unknown";
    const appleUserIdentifier =
      provider === "apple"
        ? String(user.user_metadata?.sub ?? user.user_metadata?.provider_id ?? "")
        : null;

    const { data: deletionRequest, error: insertError } = await adminClient
      .from("account_deletion_requests")
      .insert({
        user_id: user.id,
        reason: typeof body.reason === "string" ? body.reason.slice(0, 1000) : null,
        request_source: body.source ?? "ios",
        apple_user_identifier: appleUserIdentifier || null,
        status: body.confirmDeletion ? "processing" : "requested",
      })
      .select("id, status, requested_at")
      .single();

    if (insertError) {
      console.error("Failed to create deletion request:", insertError);
      return json({ error: "Could not create deletion request" }, 500);
    }

    await adminClient
      .from("profiles")
      .update({
        deletion_requested_at: new Date().toISOString(),
        deletion_status: body.confirmDeletion ? "processing" : "requested",
      })
      .eq("id", user.id);

    if (!body.confirmDeletion) {
      return json({
        deletionRequest,
        status: "requested",
        message: "Deletion request recorded. Send confirmDeletion=true to perform final deletion.",
      });
    }

    await removeUserStorage(adminClient, "field-captures", user.id);
    await removeUserStorage(adminClient, "contract-uploads", user.id);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      await adminClient
        .from("account_deletion_requests")
        .update({
          status: "failed",
          processor_note: deleteError.message,
        })
        .eq("id", deletionRequest.id);

      return json({ error: "Deletion request recorded but account deletion failed" }, 500);
    }

    await adminClient
      .from("account_deletion_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processor_note: provider === "apple"
          ? "Account deleted. Apple token revocation must be handled by the configured auth provider or a separate Apple revocation job when token material is available."
          : "Account deleted.",
      })
      .eq("id", deletionRequest.id);

    return json({
      deletionRequest: { ...deletionRequest, status: "completed" },
      status: "completed",
      message: "Account deletion completed.",
    });
  } catch (err) {
    console.error("Deletion function error:", err);
    return json({ error: "Internal error" }, 500);
  }
});

async function removeUserStorage(adminClient: ReturnType<typeof createClient>, bucket: string, userId: string) {
  const paths = await listStoragePaths(adminClient, bucket, userId);
  if (paths.length === 0) return;
  await adminClient.storage.from(bucket).remove(paths);
}

async function listStoragePaths(
  adminClient: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await adminClient.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data?.length) return [];

  const paths: string[] = [];
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    if (item.metadata) {
      paths.push(path);
    } else {
      paths.push(...await listStoragePaths(adminClient, bucket, path));
    }
  }
  return paths;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
