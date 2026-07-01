import { ArticleEditorPage } from "@/components/articles/ArticleEditorPage";

type ArticleEditorRoutePageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function ArticleEditorRoutePage({
  params,
}: ArticleEditorRoutePageProps) {
  const { articleId } = await params;

  return <ArticleEditorPage articleId={articleId} />;
}
