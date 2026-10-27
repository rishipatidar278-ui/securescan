import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    if (hash) {
      const id = getHashId(hash);
      const timers = [50, 800, 2000].map((delay, index, list) =>
        window.setTimeout(() => {
          const target = document.getElementById(id);
          if (!target && index < list.length - 1) return;
          target?.scrollIntoView({ behavior: "smooth" });
        }, delay)
      );
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}