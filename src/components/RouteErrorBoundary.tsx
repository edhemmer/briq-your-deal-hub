import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/ui/card-container";

type RouteErrorBoundaryProps = {
  children: React.ReactNode;
  routeName?: string;
};

type RouteErrorBoundaryState = {
  error: Error | null;
};

export class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("BRIX route render failed", {
      routeName: this.props.routeName,
      error,
      componentStack: info.componentStack,
    });
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (previousProps.routeName !== this.props.routeName && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1320px] items-center px-4 py-10 md:px-6 lg:px-8">
        <CardContainer className="mx-auto max-w-xl space-y-4 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-signal-warning/30 bg-signal-warning/10 text-signal-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">This screen did not load correctly</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                BRIX isolated the issue so the rest of the app can continue running. Refresh the page once; if it repeats, this route needs engineering review before relying on its output.
              </p>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload page
          </Button>
        </CardContainer>
      </main>
    );
  }
}
