import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, isAuthenticated, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const deleteAccount = async () => {
    setDeleting(true);
    setError("");

    try {
      const response = await base44.functions.invoke("deleteMyAccountData", {});
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      logout();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Your account data could not be deleted. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="relative">
        <div className="grid-trace pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.45]" />
        <div className="relative mx-auto max-w-3xl px-5 py-14 lg:py-20">
          <PageTransition>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Account</p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>

            {!isAuthenticated || !user ? (
              <div className="mt-8 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
                <p className="font-heading text-lg font-semibold tracking-tight">You are not signed in</p>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Account settings and data deletion are only available while you are signed in.
                </p>
                <Button asChild variant="outline" className="mt-6 rounded-xl">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                <section className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/60">
                      <UserIcon className="h-6 w-6 text-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg font-semibold tracking-tight">
                        {user.full_name || "Signed in"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-danger/40 bg-danger/5 p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                    <div>
                      <h2 className="font-heading text-lg font-semibold tracking-tight text-danger">Delete my data</h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        This permanently deletes every website and code scan report saved to{" "}
                        <span className="text-foreground">{user.email}</span>, along with the client record holding your
                        saved site details, and signs you out. This cannot be undone. Your sign-in account itself is not
                        removed — it stays with your account provider and has to be deleted there separately.
                      </p>
                      {error && (
                        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                          {error}
                        </p>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={deleting} className="mt-5 rounded-xl">
                            {deleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                              </>
                            ) : (
                              "Delete my data"
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete your scan data?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Every website and code scan report and the client record saved to {user.email} will be
                              deleted, and you will be signed out. This action cannot be undone. Your sign-in account
                              itself remains with your account provider and is not deleted here.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Keep my data</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={deleteAccount}
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, delete my data
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <p className="mt-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-signal" /> Only records tied to your own email are removed
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </PageTransition>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}