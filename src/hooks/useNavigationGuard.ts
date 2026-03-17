import { useEffect } from "react";

/**
 * Warns the user before leaving the page if there's unsaved data.
 * Uses the `beforeunload` browser event.
 */
export function useNavigationGuard(shouldBlock: boolean) {
  useEffect(() => {
    if (!shouldBlock) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldBlock]);
}
