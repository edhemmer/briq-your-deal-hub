import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminUsers, useAdminDeals, useAdminAuditLog, useAdminUpdateProfile } from "@/hooks/useAdminData";
import { isStripeConfigured, resolveAccessSource, getAccessSourceLabel, type AccessSource } from "@/lib/billingAccess";
import { Users, Activity, Shield, CheckCircle2, XCircle, AlertTriangle, Crown, Lock, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const SUBSCRIPTION_OPTIONS = ["free", "active", "inactive", "canceled"] as const;

function AccessSourceBadge({ source }: { source: AccessSource }) {
  const styles: Record<AccessSource, string> = {
    manual_override: "bg-primary/10 text-primary border-primary/20",
    stripe_active: "bg-[hsl(var(--briq-success)/0.12)] text-[hsl(var(--briq-success))] border-[hsl(var(--briq-success)/0.2)]",
    free_tier: "bg-secondary text-secondary-foreground border-border",
    locked: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const icons: Record<AccessSource, React.ReactNode> = {
    manual_override: <Crown className="h-3 w-3 mr-1" />,
    stripe_active: <Zap className="h-3 w-3 mr-1" />,
    free_tier: null,
    locked: <Lock className="h-3 w-3 mr-1" />,
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${styles[source]}`}>
      {icons[source]}
      {getAccessSourceLabel(source)}
    </Badge>
  );
}

export default function Admin() {
  const { user: adminUser } = useAuth();
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: deals, isLoading: loadingDeals } = useAdminDeals();
  const { data: auditLog } = useAdminAuditLog();
  const updateProfile = useAdminUpdateProfile();
  const stripeReady = isStripeConfigured();

  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({});

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await updateProfile.mutateAsync({
        targetUserId: userId,
        updates: { subscription_status: newStatus },
        actionType: `set_subscription_${newStatus}`,
      });
      toast({ title: "User updated", description: `Subscription set to ${newStatus}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleTogglePremiumOverride = async (userId: string, currentlyEnabled: boolean) => {
    const note = overrideNotes[userId] ?? "";
    try {
      await updateProfile.mutateAsync({
        targetUserId: userId,
        updates: {
          manual_premium_override: !currentlyEnabled,
          admin_override: !currentlyEnabled,
          manual_override_note: !currentlyEnabled ? (note || null) : null,
          manual_override_updated_at: new Date().toISOString(),
          manual_override_updated_by: adminUser?.id ?? null,
        },
        actionType: currentlyEnabled ? "manual_override_disabled" : "manual_override_enabled",
      });
      toast({
        title: currentlyEnabled ? "Premium override removed" : "Premium override granted",
        description: !currentlyEnabled && note ? `Note: ${note}` : undefined,
      });
      setOverrideNotes((prev) => ({ ...prev, [userId]: "" }));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <SectionContainer>
      <PageHeader title="Admin Console" description="Manage users, billing, and platform operations" />

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardContainer className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="text-lg font-semibold text-foreground">{users?.length ?? 0}</p>
          </div>
        </CardContainer>
        <CardContainer className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Deals</p>
            <p className="text-lg font-semibold text-foreground">{deals?.length ?? 0}</p>
          </div>
        </CardContainer>
        <CardContainer className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${stripeReady ? "bg-[hsl(var(--briq-success)/0.12)]" : "bg-[hsl(var(--briq-warning)/0.12)]"}`}>
            {stripeReady ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--briq-success))]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--briq-warning))]" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Billing Status</p>
            <p className="text-sm font-medium text-foreground">
              {stripeReady ? "Stripe Connected" : "Not Configured"}
            </p>
          </div>
        </CardContainer>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="deals">Recent Deals</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <CardContainer className="p-0 overflow-x-auto">
            {loadingUsers ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading users…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Signed Up</TableHead>
                    <TableHead>Access Source</TableHead>
                    <TableHead>Free Deal</TableHead>
                    <TableHead>Premium Override</TableHead>
                    <TableHead>Subscription</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => {
                    const accessSource = resolveAccessSource({
                      subscription_status: u.subscription_status,
                      free_deal_used: u.free_deal_used,
                      admin_override: (u as any).admin_override ?? false,
                      manual_premium_override: (u as any).manual_premium_override ?? false,
                      stripe_customer_id: u.stripe_customer_id,
                      stripe_subscription_id: u.stripe_subscription_id,
                    });
                    const isPremium = (u as any).manual_premium_override ?? false;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {u.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(u.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <AccessSourceBadge source={accessSource} />
                        </TableCell>
                        <TableCell>
                          {u.free_deal_used ? (
                            <Badge variant="secondary" className="text-[11px]">Used</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px]">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={isPremium ? "default" : "outline"}
                                size="sm"
                                className={`h-7 text-xs gap-1 ${isPremium ? "bg-primary text-primary-foreground" : ""}`}
                              >
                                {isPremium ? (
                                  <Crown className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {isPremium ? "Active" : "Off"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 space-y-3" align="start">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">Premium Override</p>
                                <p className="text-xs text-muted-foreground">
                                  {isPremium ? "This user has manual premium access." : "Grant full premium access without Stripe."}
                                </p>
                              </div>
                              {!isPremium && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Note (optional)</Label>
                                  <Input
                                    className="h-8 text-xs"
                                    placeholder="e.g. Beta tester, promo access"
                                    value={overrideNotes[u.id] ?? ""}
                                    onChange={(e) => setOverrideNotes((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                  />
                                </div>
                              )}
                              {(u as any).manual_override_note && isPremium && (
                                <p className="text-xs text-muted-foreground italic">
                                  Note: {(u as any).manual_override_note}
                                </p>
                              )}
                              <Button
                                size="sm"
                                variant={isPremium ? "outline" : "default"}
                                className="w-full h-8 text-xs"
                                onClick={() => handleTogglePremiumOverride(u.id, isPremium)}
                              >
                                {isPremium ? "Remove Override" : "Grant Premium Access"}
                              </Button>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.subscription_status ?? "free"}
                            onValueChange={(v) => handleStatusChange(u.id, v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBSCRIPTION_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs capitalize">
                                  {opt.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContainer>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals">
          <CardContainer className="p-0">
            {loadingDeals ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading deals…</div>
            ) : (
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
                  {deals?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm font-medium">{d.property_address}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.city}, {d.state}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.user_id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(d.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContainer>
        </TabsContent>

        {/* Audit Log Tab */}
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
                {auditLog && auditLog.length > 0 ? auditLog.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-medium capitalize">
                      {log.action_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.target_user_id?.slice(0, 8) ?? "—"}…
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.admin_user_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No audit entries yet
                    </TableCell>
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
