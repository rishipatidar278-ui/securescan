import { useBackStackSeed } from "@/lib/useNavigateBack";

export default function BackStackGuard() {
  useBackStackSeed();
  return null;
}