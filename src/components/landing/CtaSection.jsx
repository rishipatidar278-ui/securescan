import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-panel/80 px-8 py-14 text-center">
          <div className="grid-trace pointer-events-none absolute inset-0 opacity-[0.6]" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to see what we find?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Most sites come back with two or three things worth fixing. The scan takes less than a minute.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl px-6">
                <Link to="/scan">
                  Run a free scan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
                <Link to="/reports">Find a past report</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}