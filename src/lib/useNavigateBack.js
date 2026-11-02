import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const historyIndex = () => window.history.state?.idx ?? 0;

// Navigation hierarchy: "/" is the root, /scan, /scan-code and /reports are tab
// roots, report pages and /settings are their children.
const PARENT_ROUTES = [
  { pattern: /^\/report\/[^/]+\/?$/, to: "/reports" },
  { pattern: /^\/code-report\/[^/]+\/?$/, to: "/reports" },
  { pattern: /^\/(scan|scan-code|reports|settings)\/?$/, to: "/" },
];

export const parentRouteFor = (pathname) =>
  PARENT_ROUTES.find((route) => route.pattern.test(pathname))?.to || "/";

// Single back model used by the header button, the in-page links and (via the
// seeded stack below) the Android system back gesture.
export default function useNavigateBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(() => {
    if (pathname === "/") return;

    if (historyIndex() > 0) {
      navigate(-1);
      return;
    }

    navigate(parentRouteFor(pathname), { replace: true });
  }, [navigate, pathname]);
}

// A deep link (for example a report opened from a shared URL) has nothing
// beneath it in the browser stack, so the system back gesture would close the
// app. Seed the parent route underneath it so back lands inside the app.
export function useBackStackSeed() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/" || historyIndex() > 0) return;

    const parent = parentRouteFor(pathname);
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (parent === current) return;

    const state = window.history.state;
    window.history.replaceState({ ...state, idx: 0 }, "", parent);
    window.history.pushState({ ...state, idx: 1, key: `seed-${Date.now()}` }, "", current);
  }, [pathname]);
}