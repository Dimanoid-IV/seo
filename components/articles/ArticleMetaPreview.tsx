type ArticleMetaPreviewProps = {
  title: string;
  description: string;
  url: string;
};

export function ArticleMetaPreview({
  title,
  description,
  url,
}: ArticleMetaPreviewProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Preview meta snippet
      </p>
      <div className="space-y-1 rounded-lg bg-white p-4 text-left shadow-sm">
        <p className="truncate text-sm text-[#1a0dab]">{title || "Meta Title"}</p>
        <p className="truncate text-xs text-[#006621]">{url || "example.com/page"}</p>
        <p className="line-clamp-2 text-sm text-[#545454]">
          {description || "Meta description will appear here."}
        </p>
      </div>
    </section>
  );
}
