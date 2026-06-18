(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Continue to reload even if browser cache APIs are unavailable.
  }

  const next = new URL("/dashboard", window.location.origin);
  next.searchParams.set("recovered", Date.now().toString());
  window.location.replace(next.toString());
})();
