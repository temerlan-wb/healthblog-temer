import { Link } from "@tanstack/react-router";
import { Bookmark, Clock } from "lucide-react";
import type { Article } from "@/lib/articles";
import { useBookmarks } from "@/lib/bookmarks";

export function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  const { has, toggle } = useBookmarks();
  const saved = has(article.slug);

  return (
    <article
      className="glass glass-hover animate-fade-up group relative overflow-hidden rounded-[20px] p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`mb-4 h-40 rounded-2xl relative overflow-hidden ${!article.imageUrl ? `bg-gradient-to-br ${article.gradient}` : ""}`}>
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/15 px-3 py-1 text-xs text-slate-900 backdrop-blur-md ring-1 ring-white/20">
          {article.category}
        </span>
      </div>

      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="block"
      >
        <h3 className="text-lg font-semibold text-slate-900 leading-snug group-hover:text-[#15803d] transition-colors">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-on-glass line-clamp-2">{article.excerpt}</p>
      </Link>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {article.readTime} мин
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(article.slug);
          }}
          aria-label="Сохранить"
          className={`rounded-full p-1.5 transition-all ${
            saved
              ? "bg-[#22c55e]/30 text-[#15803d] ring-1 ring-[#22c55e]/50"
              : "hover:bg-white/15 text-slate-600"
          }`}
        >
          <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}