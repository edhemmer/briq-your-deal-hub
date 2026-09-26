import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return json({ error: "Authentication required." }, 401);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !anonKey || !serviceKey) return json({ error: "Artifact access is unavailable." }, 503);

  let artifactId: string;
  try {
    const body = await request.json();
    artifactId = typeof body?.artifactId === "string" ? body.artifactId : "";
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artifactId)) {
    return json({ error: "Valid artifact ID required." }, 400);
  }

  const admin = createClient(url, serviceKey);
  const { data: identity, error: identityError } = await admin.auth.getUser(token);
  if (identityError || !identity.user) return json({ error: "Authentication required." }, 401);

  const scoped = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: artifact, error: artifactError } = await scoped
    .from("reportiq_artifact_history_projection")
    .select("artifact_id,workspace_id,deal_id,property_id,definition_id,definition_hash,report_type,state,stale_reasons,storage_bucket,storage_path")
    .eq("artifact_id", artifactId)
    .maybeSingle();
  if (artifactError) return json({ error: "Artifact access is unavailable." }, 503);
  if (!artifact || artifact.state === "revoked" || artifact.state === "blocked") {
    return json({ error: "Artifact unavailable." }, 404);
  }

  let freshness = artifact.state;
  if (freshness === "current") {
    const { data: definition, error: definitionError } = await scoped
      .from("contractiq_report_definition_lineage")
      .select("definition_id,definition_hash,is_current,definition_state")
      .eq("workspace_id", artifact.workspace_id)
      .eq("definition_id", artifact.definition_id)
      .eq("report_type", artifact.report_type)
      .maybeSingle();
    if (definitionError) return json({ error: "Artifact freshness is unavailable." }, 503);
    if (!definition?.is_current || definition.definition_hash !== artifact.definition_hash ||
      !["current", "current_with_open_questions", "current_with_conflicts", "professional_review_recommended"]
        .includes(definition.definition_state)) {
      freshness = "stale";
    }
  }

  const { data: signed, error: signError } = await admin.storage
    .from(artifact.storage_bucket)
    .createSignedUrl(artifact.storage_path, 60);
  if (signError || !signed?.signedUrl) return json({ error: "Artifact retrieval is temporarily unavailable." }, 503);

  const { error: auditError } = await admin.from("audit_events").insert({
    workspace_id: artifact.workspace_id,
    deal_id: artifact.deal_id,
    property_id: artifact.property_id,
    actor_id: identity.user.id,
    action: "reportiq.artifact_access_signed",
    target_table: "reportiq_artifacts",
    target_type: "reportiq_artifact",
    target_id: artifact.artifact_id,
    source_command: "reportiq-sign-artifact",
    metadata: { state: freshness },
  });
  if (auditError) return json({ error: "Artifact access is temporarily unavailable." }, 503);

  return json({
    artifactId: artifact.artifact_id,
    state: freshness,
    staleReasons: artifact.stale_reasons,
    signedUrl: signed.signedUrl,
    expiresInSeconds: 60,
  });
});
