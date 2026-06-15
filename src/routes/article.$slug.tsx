import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Clock, Share2 } from "lucide-react";
import { fetchArticleBySlug, fetchRelatedArticles, type Article } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { useBookmarks } from "@/lib/bookmarks";

export const Route = createFileRoute("/article/$slug")({
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="glass-strong rounded-[28px] p-10 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Статья не найдена</h1>
      <Link to="/" className="btn-glass mt-6 inline-flex rounded-full px-5 py-2 text-sm">На главную</Link>
    </div>
  ),
  loader: async ({ params }) => {
    const article = await fetchArticleBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — HealthBlog` },
          { name: "description", content: loaderData.article.excerpt },
          { property: "og:title", content: loaderData.article.title },
          { property: "og:description", content: loaderData.article.excerpt },
          { property: "og:type", content: "article" },
          ...(loaderData.article.imageUrl
            ? [{ property: "og:image", content: loaderData.article.imageUrl }]
            : []),
        ]
      : [],
  }),
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const [related, setRelated] = useState<Article[]>([]);
  const { has, toggle } = useBookmarks();
  const saved = has(article.slug);

  useEffect(() => {
    fetchRelatedArticles(article.slug).then(setRelated);
  }, [article.slug]);

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: article.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Ссылка скопирована!");
    }
  };

  return (
    <article className="space-y-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <header className="glass-strong rounded-[28px] p-8 sm:p-12">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[#22c55e]/25 px-3 py-1 text-[#15803d] ring-1 ring-[#22c55e]/40">
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <Clock className="h-3.5 w-3.5" /> {article.readTime} мин
          </span>
          <span className="text-slate-600">· {article.date}</span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-5xl font-semibold leading-tight text-slate-900">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-on-glass">{article.excerpt}</p>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-700">Автор · {article.author}</p>
          <div className="flex gap-2">
            <button
              onClick={() => toggle(article.slug)}
              className={`glass rounded-full p-2.5 transition ${saved ? "bg-[#22c55e]/25 ring-1 ring-[#22c55e]/40 text-[#15803d]" : "text-slate-700"}`}
              aria-label="Сохранить"
            >
              <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
            </button>
            <button onClick={share} className="glass rounded-full p-2.5 text-slate-700" aria-label="Поделиться">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Фото или градиент */}
      <div className={`h-64 sm:h-80 rounded-[28px] relative overflow-hidden ${!article.imageUrl ? `bg-gradient-to-br ${article.gradient}` : ""}`}>
        {article.imageUrl
          ? <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover" />
          : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="glass rounded-[28px] p-8 sm:p-12 space-y-5">
        {article.content.map((p, i) => (
          <p key={i} className="text-lg leading-relaxed text-slate-800">{p}</p>
        ))}
        <div className="flex flex-wrap gap-2 pt-4">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-700 ring-1 ring-white/15">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-semibold text-slate-900">Похожие материалы</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a, i) => <ArticleCard key={a.slug} article={a} index={i} />)}
          </div>
        </section>
      )}
    </article>
  );
}