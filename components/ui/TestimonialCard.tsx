import { Quote } from "lucide-react";

type TestimonialCardProps = {
  quote: string;
  author: string;
  role: string;
  company: string;
};

export function TestimonialCard({
  quote,
  author,
  role,
  company,
}: TestimonialCardProps) {
  return (
    <div className="glass-card flex h-full flex-col p-6">
      <Quote className="mb-4 h-8 w-8 text-blue-500/40" />
      <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-300 italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="border-t border-white/10 pt-4">
        <p className="font-semibold text-white">{author}</p>
        <p className="text-sm text-slate-400">
          {role}, {company}
        </p>
      </div>
    </div>
  );
}
