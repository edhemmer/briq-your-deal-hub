import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const clearLegacyPwaCache = async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.includes("workbox") || name.includes("precache") || name.includes("vite"))
        .map((name) => caches.delete(name)),
    );
  }
};

clearLegacyPwaCache().catch(() => {
  // Cache cleanup is best-effort and must never block app startup.
});

// Prevent the browser from opening files when dropped anywhere outside
// of an explicit dropzone. Registered at module load (before React mounts)
// and in the capture phase so nothing can bypass it.
const preventFileDrop = (e: DragEvent) => {
  if (e.dataTransfer?.types?.includes("Files")) {
    e.preventDefault();
  }
};
window.addEventListener("dragover", preventFileDrop, { capture: true });
window.addEventListener("drop", preventFileDrop, { capture: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
