import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContainer } from "@/components/ui/card-container";
import BrixIcon from "@/components/BrixIcon";
import { toast } from "@/hooks/use-toast";
import { getAuthMessage } from "@/lib/authMessages";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        setCheckingRecovery(false);
      }
    });

    async function prepareRecoverySession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast({ title: "Reset link expired", description: getAuthMessage(error), variant: "destructive" });
          navigate("/forgot-password", { replace: true });
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      const hash = window.location.hash;
      const hasRecoveryToken = hash.includes("type=recovery") || hash.includes("access_token=");

      if (!mounted) return;

      if (data.session || hasRecoveryToken) {
        setRecoveryReady(true);
        setCheckingRecovery(false);
        return;
      }

      toast({
        title: "Password reset link required",
        description: "Request a new reset email so BRIX can verify this password change.",
        variant: "destructive",
      });
      navigate("/forgot-password", { replace: true });
    }

    prepareRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Password update failed", description: getAuthMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now continue in BRIX." });
      navigate("/dashboard", { replace: true });
    }
  };

  if (checkingRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Verifying reset link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <BrixIcon size={32} className="text-primary self-center" />
            <span className="text-xl font-extrabold tracking-tight text-foreground leading-none">BRIX</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none">Real Estate</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Set new password</h1>
        </div>
        <CardContainer className="p-6">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !recoveryReady}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContainer>
      </div>
    </div>
  );
}
