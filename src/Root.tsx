import { Suspense, lazy } from "react";
import { Landing } from "./Landing";

// The marketing page ships without the application bundle; the app loads on demand.
const App = lazy(() => import("./App"));

export default function Root() {
  if (window.location.pathname === "/") return <Landing />;
  return (
    <Suspense fallback={<div className="app-loading" role="status" aria-live="polite"><span className="mark" aria-hidden="true"><span /><span /><span /><span /></span>Loading BRIX…</div>}>
      <App />
    </Suspense>
  );
}
