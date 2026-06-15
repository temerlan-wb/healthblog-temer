import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchArticles, fetchCategories, type Article } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";

export const Route = createFileRoute("/library/articles")({
  head: () => ({
    meta: [
      { title: "Статьи — HealthBlog" },
      { name: "description", content: "Статьи по тренировкам, похудению, реабилитации и питанию." },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const [active, setActive] = useState("Все");
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchArticles(), fetchCategories()]).then(([arts, cats]) => {
      setArticles(arts);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const list = active === "Все" ? articles : articles.filter((a) => a.category === active);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["Все", ...categories]).map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${
              active === c
                ? "bg-[#22c55e]/30 text-slate-900 ring-1 ring-[#22c55e]/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                : "glass text-slate-700 hover:text-slate-900"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-slate-900">
        {active} · {list.length}
      </h2>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-[20px] h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a, i) => (
            <ArticleCard key={a.slug} article={a} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}