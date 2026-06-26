import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeletionRequestBody = {
  reason?: string;
  source?: "ios" | "web" | "admin";
  confirmDeletion?: boolean;
  appleAccessToken?: string;
  appleRefreshToken?: string;
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

    const appleRevocation = provider === "apple"
      ? await revokeAppleTokenIfPresent(body.appleRefreshToken ?? body.appleAccessToken)
      : { attempted: false, revoked: false, note: "Not a Sign in with Apple account." };

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
        revoked_apple_token_at: appleRevocation.revoked ? new Date().toISOString() : null,
        processor_note: provider === "apple"
          ? `Account deleted. Apple token revocation: ${appleRevocation.note}`
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

async function revokeAppleTokenIfPresent(token?: string) {
  if (!token) {
    return {
      attempted: false,
      revoked: false,
      note: "No Apple access/refresh token material was available to revoke.",
    };
  }

  const clientId = Deno.env.get("APPLE_CLIENT_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  if (!clientId || !teamId || !keyId || !privateKey) {
    return {
      attempted: false,
      revoked: false,
      note: "Apple revocation token was present, but Apple client secret environment variables are not configured.",
    };
  }

  try {
    const key = await importPKCS8(privateKey, "ES256");
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setAudience("https://appleid.apple.com")
      .setSubject(clientId)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(key);

    const form = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: "refresh_token",
    });

    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        attempted: true,
        revoked: false,
        note: `Apple token revocation failed with ${response.status}: ${text.slice(0, 300)}`,
      };
    }

    return {
      attempted: true,
      revoked: true,
      note: "Apple token revoked through Apple's REST API.",
    };
  } catch (err) {
    return {
      attempted: true,
      revoked: false,
      note: `Apple token revocation error: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
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
