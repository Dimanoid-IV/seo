type ArticleMetaPreviewProps = {
  title: string;
  description: string;
  url: string;
  labels?: {
    title: string;
    fallbackTitle: string;
    fallbackDescription: string;
  };
};

export function ArticleMetaPreview({
  title,
  description,
  url,
  labels,
}: ArticleMetaPreviewProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        {labels?.title ?? "Preview meta snippet"}
      </p>
      <div className="space-y-1 rounded-lg bg-white p-4 text-left shadow-sm">
        <p className="truncate text-sm text-[#1a0dab]">
          {title || labels?.fallbackTitle || "Meta Title"}
        </p>
        <p className="truncate text-xs text-[#006621]">{url || "example.com/page"}</p>
        <p className="line-clamp-2 text-sm text-[#545454]">
          {description ||
            labels?.fallbackDescription ||
            "Meta description will appear here."}
        </p>
      </div>
    </section>
  );
}
