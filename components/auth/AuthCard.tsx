import Link from "next/link";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="mb-8 flex flex-col items-center text-center">
        <Link
          href="/ru"
          className="mb-6 flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
            <Sparkles className="size-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">RankBoost</span>
        </Link>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>

      <div className="glass-card p-6 sm:p-8">{children}</div>

      {footer ? (
        <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>
      ) : null}
    </div>
  );
}
