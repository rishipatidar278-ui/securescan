import { Link, useLocation } from "react-router-dom";
import { LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/lib/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SiteNav() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const onLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex min-w-0 items-center gap-2">
          {!onLanding && <BackButton />}
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal/12 ring-1 ring-signal/30">
              <ShieldCheck className="h-5 w-5 text-signal" />
            </span>
            <span className="truncate font-heading text-lg font-semibold tracking-tight">SecureScan</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:gap-7 md:flex">
          {onLanding && (
            <>
              <a href="#checks" className="hidden transition-colors hover:text-foreground md:inline">
                What we check
              </a>
              <a href="#how" className="hidden transition-colors hover:text-foreground md:inline">
                How it works
              </a>
            </>
          )}
          <Link to="/scan-code" className="transition-colors hover:text-foreground">
            Code scan
          </Link>
          <Link to="/reports" className="transition-colors hover:text-foreground">
            Reports
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden rounded-full px-4 md:inline-flex">
            <Link to="/scan">Run a scan</Link>
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground transition-colors hover:bg-accent"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-sm font-medium">{user.full_name || "Signed in"}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex cursor-pointer items-center">
                    <Settings className="mr-2 h-4 w-4" /> Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => logout()} className="cursor-pointer text-danger">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}