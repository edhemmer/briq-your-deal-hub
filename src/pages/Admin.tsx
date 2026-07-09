import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Crown,
  KeyRound,
  Lock,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Trash2,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useAdminConsoleAction,
  useAdminConsoleOverview,
  type AdminConsoleUser,
} from "@/hooks/useAdminData";
import { toast } from "@/hooks/use-toast";
import { resolveAccessSource, getAccessSourceLabel, type AccessSource } from "@/lib/billingAccess";

const SUBSCRIPTION_OPTIONS = ["free", "active", "inactive", "canceled", "admin_override"] as const;
const PLAN_FILTERS = ["all", "paid", "free", "comped", "locked"] as const;

function AccessSourceBadge({ source }: { source: AccessSource }) {
  const styles: Record<AccessSource, string> = {
    manual_override: "bg-primary/10 text-primary border-primary/20",
    stripe_active: "bg-signal-positive/10 text-signal-positive border-signal-positive/20",
    free_tier: "bg-secondary text-secondary-foreground border-border",
    locked: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const icons: Record<AccessSource, React.ReactNode> = {
    manual_override: <Crown className="mr-1 h-3 w-3" />,
    stripe_active: <Zap className="mr-1 h-3 w-3" />,
    free_tier: null,
    locked: <Lock className="mr-1 h-3 w-3" />,
  };

  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${styles[source]}`}>
      {icons[source]}
      {getAccessSourceLabel(source)}
    </Badge>
  );
}

export default function Admin() {
  const { data, isLoading, error } = useAdminConsoleOverview();
  const adminAction = useAdminConsoleAction();
  const stripeReady = data?.system?.stripeConfigured ?? data?.kpis?.stripeConfigured ?? false;
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<(typeof PLAN_FILTERS)[number]>("all");
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({});

  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const kpis = data?.kpis;

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const plan = getPlanKind(user);
      const matchesPlan = planFilter === "all" || plan === planFilter;
      if (!matchesPlan) return false;
      if (!term) return true;
      return [user.email, user.id, user.provider, user.subscription_status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [users, search, planFilter]);

  const handleStatusChange = async (userId: string, subscriptionStatus: string) => {
    try {
      await adminAction.mutateAsync({
        action: "set_subscription",
        targetUserId: userId,
        subscriptionStatus,
      });
      toast({ title: "Subscription updated", description: `Status set to ${subscriptionStatus}.` });
    } catch (e) {
      toast({ title: "Update failed", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleTogglePremiumOverride = async (user: AdminConsoleUser, enabled: boolean) => {
    try {
      await adminAction.mutateAsync({
        action: "set_premium_override",
        targetUserId: user.id,
        enabled,
        note: enabled ? overrideNotes[user.id] : undefined,
      });
      toast({
        title: enabled ? "Free access granted" : "Free access removed",
        description: user.email ?? user.id,
      });
      setOverrideNotes((prev) => ({ ...prev, [user.id]: "" }));
    } catch (e) {
      toast({ title: "Override failed", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handlePasswordReset = async (user: AdminConsoleUser) => {
    try {
      await adminAction.mutateAsync({
        action: "send_password_reset",
        targetUserId: user.id,
        email: user.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast({ title: "Password reset sent", description: user.email ?? "Reset email queued." });
    } catch (e) {
      toast({ title: "Reset failed", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleAccountStatusChange = async (user: AdminConsoleUser, accountStatus: "active" | "inactive") => {
    try {
      await adminAction.mutateAsync({
        action: "set_account_status",
        targetUserId: user.id,
        accountStatus,
      });
      toast({
        title: accountStatus === "active" ? "User reactivated" : "User deactivated",
        description: user.email ?? user.id,
      });
    } catch (e) {
      toast({ title: "Account update failed", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleDeleteUser = async (user: AdminConsoleUser) => {
    const confirmed = window.confirm(
      `Delete ${user.email ?? user.id}? This removes the Supabase auth account and marks the profile deleted. This cannot be undone from BRIX.`,
    );
    if (!confirmed) return;

    try {
      await adminAction.mutateAsync({
        action: "delete_user",
        targetUserId: user.id,
        note: "Deleted from BRIX admin control panel",
      });
      toast({ title: "User deleted", description: user.email ?? user.id });
    } catch (e) {
      toast({ title: "Delete failed", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  if (error) {
    return (
      <SectionContainer>
        <PageHeader title="Admin Control Panel" description="Manage users, access, and platform operations." />
        <CardContainer className="border-destructive/30 bg-destructive/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <h2 className="font-semibold text-foreground">Admin console unavailable</h2>
              <p className="mt-1 text-sm text-muted-foreground">{getErrorMessage(error)}</p>
            </div>
          </div>
        </CardContainer>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <PageHeader
        title="Admin Control Panel"
        description="Manage users, free-access overrides, password resets, account status, and SaaS operating KPIs."
      />

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Monthly revenue" value={formatMoney(kpis?.monthlyRecurringRevenueCents ?? 0)} sub={`${kpis?.activePaidUsers ?? 0} paid users at ${formatMoney(kpis?.monthlyPriceCents ?? 15599)}/mo`} />
        <KpiCard icon={Zap} label="Quarterly run-rate" value={formatMoney(kpis?.quarterlyRunRateCents ?? 0)} sub="Projected from current paid users" />
        <KpiCard icon={Users} label="New signups" value={kpis?.newUsers30d ?? 0} sub={`${kpis?.newUsers7d ?? 0} new in 7 days · ${kpis?.totalUsers ?? 0} total`} />
        <KpiCard icon={AlertTriangle} label="Monthly churn" value={kpis?.cancellations30d ?? 0} sub={`${kpis?.openDeletionRequests ?? 0} account delete requests`} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Activity} label="Deal analyses" value={kpis?.totalDeals ?? 0} sub={`${kpis?.deals30d ?? 0} created in 30 days`} />
        <KpiCard icon={CheckCircle2} label="Paid plans" value={kpis?.activePaidUsers ?? 0} sub={`${kpis?.activeSubscribers ?? 0} active subscriptions total`} />
        <KpiCard icon={Crown} label="Free comped access" value={kpis?.manualOverrides ?? 0} sub="Manual app access overrides" />
        <KpiCard icon={Shield} label="Free users" value={kpis?.freeUsers ?? 0} sub={`${kpis?.lockedUsers ?? 0} locked or canceled users`} />
      </div>

      <CardContainer className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatusItem
            icon={stripeReady ? CheckCircle2 : AlertTriangle}
            label="Billing configuration"
            value={stripeReady ? "Stripe configured" : "Stripe not configured"}
            tone={stripeReady ? "positive" : "warning"}
          />
          <StatusItem icon={Sparkles} label="Access model" value="Manual free access available" tone="info" />
          <StatusItem icon={TrendingUp} label="Activated users" value={`${kpis?.usersWithDeals ?? 0} users have created deals`} tone="positive" />
        </div>
        <div className="mt-4 grid gap-2 border-t border-border pt-4 text-xs md:grid-cols-3">
          <SecretStatus label="Stripe secret" ok={!!data?.system?.stripeSecretConfigured} />
          <SecretStatus label="Webhook secret" ok={!!data?.system?.stripeWebhookConfigured} />
          <SecretStatus label="Price ID" ok={!!data?.system?.stripePriceConfigured} />
        </div>
      </CardContainer>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 md:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <CardContainer className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">User Access</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search users, grant free access, set subscription state, or send password reset emails.</p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as typeof planFilter)}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_FILTERS.map((filter) => (
                      <SelectItem key={filter} value={filter} className="capitalize">
                        {filter === "comped" ? "Comped free" : filter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Free access</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Password</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading admin users...</TableCell>
                    </TableRow>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((user) => <UserRow key={user.id} user={user} overrideNotes={overrideNotes} setOverrideNotes={setOverrideNotes} onToggleOverride={handleTogglePremiumOverride} onStatusChange={handleStatusChange} onAccountStatusChange={handleAccountStatusChange} onDeleteUser={handleDeleteUser} onPasswordReset={handlePasswordReset} />)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No users found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="usage">
          <CardContainer className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.deals ?? []).map((deal) => {
                  const owner = users.find((user) => user.id === deal.user_id);
                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.property_address}</TableCell>
                      <TableCell className="text-muted-foreground">{[deal.city, deal.state].filter(Boolean).join(", ") || "Unknown"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{owner?.email ?? shortId(deal.user_id)}</TableCell>
                      <TableCell>{formatDate(deal.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContainer>
        </TabsContent>

        <TabsContent value="audit">
          <CardContainer className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.auditLog ?? []).length ? (data?.auditLog ?? []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium capitalize">{log.action_type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.target_user_id ? shortId(log.target_user_id) : "System"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{shortId(log.admin_user_id)}</TableCell>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No audit entries yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContainer>
        </TabsContent>

        <TabsContent value="compliance">
          <CardContainer className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.deletionRequests ?? []).length ? (data?.deletionRequests ?? []).map((request) => {
                  const owner = users.find((user) => user.id === request.user_id);
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="text-xs text-muted-foreground">{shortId(request.id)}</TableCell>
                      <TableCell>{owner?.email ?? (request.user_id ? shortId(request.user_id) : "Deleted user")}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{request.status}</Badge></TableCell>
                      <TableCell className="capitalize">{request.request_source}</TableCell>
                      <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No account deletion requests.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContainer>
        </TabsContent>
      </Tabs>
    </SectionContainer>
  );
}

function UserRow({
  user,
  overrideNotes,
  setOverrideNotes,
  onToggleOverride,
  onStatusChange,
  onAccountStatusChange,
  onDeleteUser,
  onPasswordReset,
}: {
  user: AdminConsoleUser;
  overrideNotes: Record<string, string>;
  setOverrideNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onToggleOverride: (user: AdminConsoleUser, enabled: boolean) => void;
  onStatusChange: (userId: string, subscriptionStatus: string) => void;
  onAccountStatusChange: (user: AdminConsoleUser, accountStatus: "active" | "inactive") => void;
  onDeleteUser: (user: AdminConsoleUser) => void;
  onPasswordReset: (user: AdminConsoleUser) => void;
}) {
  const accessSource = resolveAccessSource({
    subscription_status: user.subscription_status,
    free_deal_used: user.free_deal_used,
    admin_override: user.admin_override ?? false,
    manual_premium_override: user.manual_premium_override ?? false,
    stripe_customer_id: user.stripe_customer_id,
    stripe_subscription_id: user.stripe_subscription_id,
  });
  const hasOverride = user.manual_premium_override || user.admin_override;
  const isInactive = user.account_status === "inactive" || user.deletion_status === "inactive";

  return (
    <TableRow className={isInactive ? "opacity-60" : undefined}>
      <TableCell>
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{user.email ?? "No email available"}</p>
            {user.email_confirmed_at && <CheckCircle2 className="h-3.5 w-3.5 text-signal-positive" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{shortId(user.id)} · {user.provider ?? "email"} · joined {formatDate(user.created_at)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Last sign in: {user.last_sign_in_at ? formatRelative(user.last_sign_in_at) : "Never"}</p>
          {isInactive && <p className="mt-1 text-xs font-semibold text-destructive">Inactive account</p>}
        </div>
      </TableCell>
      <TableCell><PlanBadge user={user} /></TableCell>
      <TableCell><AccessSourceBadge source={accessSource} /></TableCell>
      <TableCell>
        <div className="text-sm">
          <p className="font-semibold text-foreground">{user.deal_count} deals</p>
          <p className="text-xs text-muted-foreground">{user.free_deal_used ? "Free deal used" : "Free deal available"}</p>
        </div>
      </TableCell>
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={hasOverride ? "default" : "outline"} size="sm" className="h-8 gap-2 text-xs">
              <Crown className="h-3.5 w-3.5" />
              {hasOverride ? "Granted" : "Grant"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4" align="start">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Free app access</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manual override lets this user use BRIX without an active paid subscription.
              </p>
            </div>
            {!hasOverride && (
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Input
                  value={overrideNotes[user.id] ?? ""}
                  onChange={(e) => setOverrideNotes((prev) => ({ ...prev, [user.id]: e.target.value }))}
                />
              </div>
            )}
            {hasOverride && user.manual_override_note && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                {user.manual_override_note}
              </div>
            )}
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Override enabled</p>
                <p className="text-xs text-muted-foreground">Full app access</p>
              </div>
              <Switch checked={!!hasOverride} onCheckedChange={(checked) => onToggleOverride(user, checked)} />
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        <Select value={user.subscription_status ?? "free"} onValueChange={(value) => onStatusChange(user.id, value)}>
          <SelectTrigger className="h-8 w-[132px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBSCRIPTION_OPTIONS.map((option) => (
              <SelectItem key={option} value={option} className="text-xs capitalize">
                {option.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex min-w-[170px] gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-2 text-xs"
            onClick={() => onAccountStatusChange(user, isInactive ? "active" : "inactive")}
          >
            <UserX className="h-3.5 w-3.5" />
            {isInactive ? "Reactivate" : "Deactivate"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 px-2"
            onClick={() => onDeleteUser(user)}
            title="Delete user"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Button size="sm" variant="outline" className="h-8 gap-2 text-xs" disabled={!user.email} onClick={() => onPasswordReset(user)}>
          <KeyRound className="h-3.5 w-3.5" />
          Reset
        </Button>
      </TableCell>
    </TableRow>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub: string }) {
  return (
    <CardContainer className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-black text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </CardContainer>
  );
}

function PlanBadge({ user }: { user: AdminConsoleUser }) {
  const plan = getPlanKind(user);
  const styles: Record<ReturnType<typeof getPlanKind>, string> = {
    paid: "border-signal-positive/20 bg-signal-positive/10 text-signal-positive",
    free: "border-border bg-secondary text-secondary-foreground",
    comped: "border-primary/20 bg-primary/10 text-primary",
    locked: "border-destructive/20 bg-destructive/10 text-destructive",
  };
  const label: Record<ReturnType<typeof getPlanKind>, string> = {
    paid: "Paid",
    free: "Free",
    comped: "Comped free",
    locked: "Locked",
  };

  return <Badge variant="outline" className={styles[plan]}>{label[plan]}</Badge>;
}

function getPlanKind(user: AdminConsoleUser) {
  if (user.manual_premium_override || user.admin_override || user.subscription_status === "admin_override") return "comped";
  if (user.subscription_status === "active") return "paid";
  if (["inactive", "canceled"].includes(user.subscription_status ?? "")) return "locked";
  return "free";
}

function StatusItem({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: "positive" | "warning" | "info" }) {
  const toneClass = tone === "positive" ? "text-signal-positive bg-signal-positive/10" : tone === "warning" ? "text-signal-warning bg-signal-warning/10" : "text-primary bg-primary/10";
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SecretStatus({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="outline" className={ok ? "border-signal-positive/20 text-signal-positive" : "border-signal-warning/20 text-signal-warning"}>
        {ok ? "Set" : "Missing"}
      </Badge>
    </div>
  );
}

function formatDate(value: string) {
  return format(new Date(value), "MMM d, yyyy");
}

function formatDateTime(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

function formatRelative(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function shortId(value: string) {
  return `${value.slice(0, 8)}...`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
