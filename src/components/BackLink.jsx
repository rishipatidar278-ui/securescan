import { ArrowLeft } from "lucide-react";
import useNavigateBack from "@/lib/useNavigateBack";
import { cn } from "@/lib/utils";

export default function BackLink({ label = "Back", className }) {
  const goBack = useNavigateBack();

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );
}