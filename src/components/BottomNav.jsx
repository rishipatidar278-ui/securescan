import { Link, useLocation } from "react-router-dom";
import { Code2, FileText, Globe, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", to: "/", icon: Home, active: (path) => path === "/" },
  {
    label: "Web Scan",
    to: "/scan",
    icon: Globe,
    active: (path) => path === "/scan" || path.startsWith("/report/"),
  },
  {
    label: "Code Scan",
    to: "/scan-code",
    icon: Code2,
    active: (path) => path === "/scan-code" || path.startsWith("/code-report/"),
  },
  { label: "Reports", to: "/reports", icon: FileText, active: (path) => path === "/reports" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {ITEMS.map((item) => {
          const isActive = item.active(pathname);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] select-none flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium tracking-wide transition-colors",
                  isActive ? "text-signal" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-signal")} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}