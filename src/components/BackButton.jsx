import { ChevronLeft } from "lucide-react";
import useNavigateBack from "@/lib/useNavigateBack";

export default function BackButton() {
  const goBack = useNavigateBack();

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}