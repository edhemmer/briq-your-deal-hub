import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminUsers, useAdminDeals, useAdminAuditLog, useAdminUpdateProfile } from "@/hooks/useAdminData";
import { isStripeConfigured } from "@/lib/billingAccess";
import { Users, Activity, Shield, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const SUBSCRIPTION_OPTIONS = ["free", "active", "inactive", "canceled", "admin_override"] as const;

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "free";
  const variants: Record<string, string> = {
    active: "bg-[hsl(var(--briq-success)/0.12)] text-[hsl(var(--briq-success))] border-[hsl(var(--briq-success)/0.2)]",
    admin_override: "bg-primary/10 text-primary border-primary/20",
    free: "bg-secondary text-secondary-foreground border-border",
    inactive: "bg-[hsl(var(--briq-warning)/0.12)] text-[hsl(var(--briq-warning))] border-[hsl(var(--briq-warning)/0.2)]",
    canceled: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium capitalize ${variants[s] ?? variants.free}`}>
      {s.replace("_", " ")}
    </Badge>
  );
}

export default function Admin() {
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: deals, isLoading: loadingDeals } = useAdminDeals();
  const { data: auditLog } = useAdminAuditLog();
  const updateProfile = useAdminUpdateProfile();
  const stripeReady = isStripeConfigured();

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await updateProfile.mutateAsync({
        targetUserId: userId,
        updates: {
          subscription_status: newStatus,
          admin_override: newStatus === "admin_override",
        },
        actionType: `set_subscription_${newStatus}`,
      });
      toast({ title: "User updated", description: `Subscription set to ${newStatus}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleToggleOverride = async (userId: string, current: boolean) => {
    try {
      await updateProfile.mutateAsync({
        targetUserId: userId,
        updates: {
          admin_override: !current,
          ...(! current ? { subscription_status: "admin_override" } : {}),
        },
        actionType: current ? "remove_admin_override" : "grant_admin_override",
      });
      toast({ title: current ? "Override removed" : "Override granted" });
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
          <CardContainer className="p-0">
            {loadingUsers ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading users…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Signed Up</TableHead>
                    <TableHead>Free Deal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                        {u.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {u.free_deal_used ? (
                          <Badge variant="secondary" className="text-[11px]">Used</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.subscription_status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleOverride(u.id, u.admin_override ?? false)}
                        >
                          {u.admin_override ? (
                            <Shield className="h-3 w-3 text-primary mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                          )}
                          {u.admin_override ? "Active" : "Off"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.subscription_status ?? "free"}
                          onValueChange={(v) => handleStatusChange(u.id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-[130px]">
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
                  ))}
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
