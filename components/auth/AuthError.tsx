import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthErrorProps = {
  message: string;
  className?: string;
};

export function AuthError({ message, className }: AuthErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300",
        className
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
