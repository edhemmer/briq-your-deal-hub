import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminAction =
  | "overview"
  | "set_subscription"
  | "set_premium_override"
  | "send_password_reset"
  | "set_account_status"
  | "delete_user";

type AdminBody = {
  action?: AdminAction;
  targetUserId?: string;
  email?: string;
  subscriptionStatus?: string;
  enabled?: boolean;
  note?: string;
  redirectTo?: string;
  accountStatus?: string;
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

    const caller = userData.user;
    const { data: roles, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (roleError) {
      console.error("Admin role lookup failed:", roleError);
      return json({ error: "Could not verify admin access" }, 500);
    }

    const roleNames = (roles ?? []).map((role) => role.role);
    const isOwnerEmail = isConfiguredOwnerEmail(caller.email);
    const isAdmin = isOwnerEmail || roleNames.includes("admin") || roleNames.includes("superadmin");
    if (!isAdmin) {
      return json({ error: "Admin access required" }, 403);
    }

    if (isOwnerEmail) {
      await ensureOwnerAdmin(adminClient, caller.id);
    }

    const body = (await req.json().catch(() => ({}))) as AdminBody;
    const action = body.action ?? "overview";

    if (action === "overview") {
      return json(await buildOverview(adminClient), 200);
    }

    if (action === "set_subscription") {
      const status = sanitizeStatus(body.subscriptionStatus);
      if (!body.targetUserId || !status) {
        return json({ error: "targetUserId and valid subscriptionStatus are required" }, 400);
      }

      const updates = { subscription_status: status };
      await updateProfile(adminClient, caller.id, body.targetUserId, updates, `set_subscription_${status}`);
      return json({ ok: true }, 200);
    }

    if (action === "set_premium_override") {
      if (!body.targetUserId || typeof body.enabled !== "boolean") {
        return json({ error: "targetUserId and enabled are required" }, 400);
      }

      const updates = {
        admin_override: body.enabled,
        manual_premium_override: body.enabled,
        manual_override_note: body.enabled ? truncate(body.note, 500) : null,
        manual_override_updated_at: new Date().toISOString(),
        manual_override_updated_by: caller.id,
        subscription_status: body.enabled ? "admin_override" : "free",
      };

      await updateProfile(
        adminClient,
        caller.id,
        body.targetUserId,
        updates,
        body.enabled ? "manual_override_enabled" : "manual_override_disabled",
      );
      return json({ ok: true }, 200);
    }

    if (action === "send_password_reset") {
      const email = await resolveEmail(adminClient, body);
      if (!email) {
        return json({ error: "Could not resolve user email" }, 400);
      }

      const redirectTo = body.redirectTo ?? "https://brixrealestate.app/reset-password";
      const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        console.error("Password reset failed:", resetError);
        return json({ error: "Password reset email could not be sent" }, 500);
      }

      await insertAudit(adminClient, caller.id, body.targetUserId ?? null, "password_reset_sent", {
        email,
        redirectTo,
      });

      return json({ ok: true }, 200);
    }

    if (action === "set_account_status") {
      const status = sanitizeAccountStatus(body.accountStatus);
      if (!body.targetUserId || !status) {
        return json({ error: "targetUserId and valid accountStatus are required" }, 400);
      }

      const updates =
        status === "active"
          ? {
              account_status: "active",
              deactivated_at: null,
              deactivated_by: null,
              deletion_status: "active",
            }
          : {
              account_status: status,
              deactivated_at: new Date().toISOString(),
              deactivated_by: caller.id,
              subscription_status: "inactive",
            };

      await updateProfile(adminClient, caller.id, body.targetUserId, updates, `account_${status}`);
      return json({ ok: true }, 200);
    }

    if (action === "delete_user") {
      if (!body.targetUserId) {
        return json({ error: "targetUserId is required" }, 400);
      }

      if (body.targetUserId === caller.id) {
        return json({ error: "You cannot delete your own admin account from this panel" }, 400);
      }

      await insertAudit(adminClient, caller.id, body.targetUserId, "admin_delete_user_requested", {
        note: truncate(body.note, 500),
      });

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          account_status: "deleted",
          deletion_status: "completed",
          deletion_completed_at: new Date().toISOString(),
          subscription_status: "inactive",
        })
        .eq("id", body.targetUserId);

      if (profileError) {
        console.error("Profile deletion marker failed:", profileError);
        return json({ error: "Could not mark profile deleted" }, 500);
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(body.targetUserId);
      if (deleteError) {
        console.error("Auth user deletion failed:", deleteError);
        return json({ error: "Profile marked deleted, but auth user deletion failed" }, 500);
      }

      await insertAudit(adminClient, caller.id, body.targetUserId, "admin_delete_user_completed", {
        note: truncate(body.note, 500),
      });

      return json({ ok: true }, 200);
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error("Admin console error:", error);
    return json({ error: "Unexpected admin console error" }, 500);
  }
});

async function buildOverview(adminClient: ReturnType<typeof createClient>) {
  const [{ data: authUsers }, { data: profiles }, { data: deals }, { data: auditLog }, { data: deletionRequests }] =
    await Promise.all([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      adminClient.from("profiles").select("*").order("created_at", { ascending: false }),
      adminClient.from("deals").select("id, user_id, property_address, city, state, created_at").order("created_at", { ascending: false }).limit(200),
      adminClient.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(100),
      adminClient.from("account_deletion_requests").select("*").order("requested_at", { ascending: false }).limit(100),
    ]);

  const usersById = new Map((authUsers?.users ?? []).map((user) => [user.id, user]));
  const dealRows = deals ?? [];
  const profileRows = profiles ?? [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const users = profileRows.map((profile) => {
    const authUser = usersById.get(profile.id);
    const userDeals = dealRows.filter((deal) => deal.user_id === profile.id);
    return {
      ...profile,
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
      phone: authUser?.phone ?? null,
      provider: authUser?.app_metadata?.provider ?? profile.auth_provider ?? "email",
      deal_count: userDeals.length,
    };
  });

  const authOnlyUsers = (authUsers?.users ?? [])
    .filter((authUser) => !profileRows.some((profile) => profile.id === authUser.id))
    .map((authUser) => ({
      id: authUser.id,
      created_at: authUser.created_at,
      subscription_status: "free",
      free_deal_used: false,
      admin_override: false,
      manual_premium_override: false,
      manual_override_note: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      deletion_status: "active",
      account_status: "active",
      apple_private_relay_email: false,
      apple_user_identifier: null,
      email: authUser.email ?? null,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      email_confirmed_at: authUser.email_confirmed_at ?? null,
      phone: authUser.phone ?? null,
      provider: authUser.app_metadata?.provider ?? "email",
      deal_count: dealRows.filter((deal) => deal.user_id === authUser.id).length,
    }));

  const allUsers = [...users, ...authOnlyUsers];

  const kpis = {
    monthlyPriceCents: monthlyPriceCents(),
    totalUsers: allUsers.length,
    newUsers7d: allUsers.filter((user) => isWithin(user.created_at, now, 7 * day)).length,
    newUsers30d: allUsers.filter((user) => isWithin(user.created_at, now, 30 * day)).length,
    activeSubscribers: allUsers.filter((user) => user.subscription_status === "active").length,
    activePaidUsers: allUsers.filter((user) => user.subscription_status === "active" && !user.manual_premium_override && !user.admin_override).length,
    manualOverrides: allUsers.filter((user) => user.manual_premium_override || user.admin_override).length,
    freeUsers: allUsers.filter((user) => (user.subscription_status ?? "free") === "free" && !user.manual_premium_override && !user.admin_override).length,
    lockedUsers: allUsers.filter((user) => ["inactive", "canceled"].includes(user.subscription_status ?? "") || user.account_status === "inactive").length,
    cancellations30d: allUsers.filter((user) => user.subscription_status === "canceled" && isWithin(user.subscription_end_date, now, 30 * day)).length,
    totalDeals: dealRows.length,
    deals30d: dealRows.filter((deal) => isWithin(deal.created_at, now, 30 * day)).length,
    usersWithDeals: new Set(dealRows.map((deal) => deal.user_id)).size,
    openDeletionRequests: (deletionRequests ?? []).filter((request) => ["requested", "processing"].includes(request.status)).length,
    appleUsers: allUsers.filter((user) => user.provider === "apple" || user.apple_user_identifier).length,
    stripeConfigured: isStripeServerConfigured(),
  };

  const activePaidUsers = kpis.activePaidUsers;
  const monthlyRecurringRevenueCents = activePaidUsers * kpis.monthlyPriceCents;

  return {
    kpis: {
      ...kpis,
      monthlyRecurringRevenueCents,
      quarterlyRunRateCents: monthlyRecurringRevenueCents * 3,
    },
    users: allUsers,
    deals: dealRows,
    auditLog: auditLog ?? [],
    deletionRequests: deletionRequests ?? [],
    system: {
      stripeConfigured: isStripeServerConfigured(),
      stripeSecretConfigured: Boolean(Deno.env.get("STRIPE_SECRET_KEY")),
      stripeWebhookConfigured: Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET")),
      stripePriceConfigured: Boolean(Deno.env.get("STRIPE_PRICE_ID") || Deno.env.get("BRIX_STRIPE_PRICE_ID")),
    },
  };
}

function monthlyPriceCents() {
  const configured = Number(Deno.env.get("BRIX_MONTHLY_PRICE_CENTS") ?? "");
  return Number.isFinite(configured) && configured > 0 ? configured : 15599;
}

async function updateProfile(
  adminClient: ReturnType<typeof createClient>,
  adminUserId: string,
  targetUserId: string,
  updates: Record<string, unknown>,
  actionType: string,
) {
  const { error } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", targetUserId);

  if (error) {
    console.error("Profile update failed:", error);
    throw error;
  }

  await insertAudit(adminClient, adminUserId, targetUserId, actionType, updates);
}

async function insertAudit(
  adminClient: ReturnType<typeof createClient>,
  adminUserId: string,
  targetUserId: string | null,
  actionType: string,
  details: Record<string, unknown>,
) {
  const { error } = await adminClient.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    target_user_id: targetUserId,
    action_type: actionType,
    details,
  });

  if (error) {
    console.error("Audit insert failed:", error);
  }
}

async function resolveEmail(adminClient: ReturnType<typeof createClient>, body: AdminBody) {
  if (body.email && body.email.includes("@")) return body.email.trim().toLowerCase();
  if (!body.targetUserId) return null;

  const { data, error } = await adminClient.auth.admin.getUserById(body.targetUserId);
  if (error) {
    console.error("User email lookup failed:", error);
    return null;
  }

  return data.user?.email ?? null;
}

function sanitizeStatus(status?: string) {
  if (!status) return null;
  return ["free", "active", "inactive", "canceled", "admin_override"].includes(status) ? status : null;
}

function sanitizeAccountStatus(status?: string) {
  if (!status) return null;
  return ["active", "inactive"].includes(status) ? status : null;
}

function isConfiguredOwnerEmail(email?: string | null) {
  if (!email) return false;
  const configured = (Deno.env.get("BRIX_SUPERADMIN_EMAILS") ?? "edhemmer@gmail.com")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email.toLowerCase());
}

async function ensureOwnerAdmin(adminClient: ReturnType<typeof createClient>, userId: string) {
  await adminClient
    .from("user_roles")
    .upsert(
      [
        { user_id: userId, role: "admin" },
        { user_id: userId, role: "superadmin" },
      ],
      { onConflict: "user_id,role" },
    );

  await adminClient
    .from("profiles")
    .upsert(
      {
        id: userId,
        subscription_status: "admin_override",
        admin_override: true,
        manual_premium_override: true,
        manual_override_note: "Founder/developer super admin access",
        manual_override_updated_at: new Date().toISOString(),
        account_status: "active",
        deletion_status: "active",
      },
      { onConflict: "id" },
    );
}

function isStripeServerConfigured() {
  return Boolean(
    Deno.env.get("STRIPE_SECRET_KEY")
      && (Deno.env.get("STRIPE_PRICE_ID") || Deno.env.get("BRIX_STRIPE_PRICE_ID"))
      && Deno.env.get("STRIPE_WEBHOOK_SECRET"),
  );
}

function truncate(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function isWithin(value: string | null | undefined, now: number, windowMs: number) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && now - time <= windowMs;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
