import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Where to land when there is no in-app history to step back through
// (for example a report opened straight from a shared link).
const PARENT_ROUTES = [
  { pattern: /^\/report\/[^/]+\/?$/, to: "/reports" },
  { pattern: /^\/code-report\/[^/]+\/?$/, to: "/reports" },
  { pattern: /^\/(scan|scan-code|reports|settings)\/?$/, to: "/" },
];

const parentFor = (pathname) => PARENT_ROUTES.find((route) => route.pattern.test(pathname))?.to || "/";

export default function useNavigateBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(() => {
    const historyIndex = window.history.state?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(parentFor(pathname));
  }, [navigate, pathname]);
}