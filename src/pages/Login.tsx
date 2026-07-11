import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContainer } from "@/components/ui/card-container";
import BrixIcon from "@/components/BrixIcon";
import SEO from "@/components/SEO";
import { toast } from "@/hooks/use-toast";
import { getAuthMessage } from "@/lib/authMessages";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: getAuthMessage(error), variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: getAuthMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Sign In to BRIX" description="Sign in to BRIX Real Estate acquisition intelligence." path="/login" />
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <BrixIcon size={32} className="self-center text-primary" />
            <span className="text-xl font-extrabold leading-none tracking-tight text-foreground">BRIX</span>
            <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-muted-foreground">
              Real Estate
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground">Continue to your deal dashboard</p>
        </div>

        <CardContainer className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="transition-colors hover:text-foreground">
              Forgot password?
            </Link>
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-foreground hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContainer>
      </div>
    </div>
  );
}
