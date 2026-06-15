import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Clock, GraduationCap, User, PlayCircle, CheckCircle } from "lucide-react";
import { fetchCourseBySlug, fetchRelatedCourses, type Course } from "@/lib/courses";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/course/$slug")({
  component: CoursePage,
  notFoundComponent: () => (
    <div className="glass-strong rounded-[28px] p-10 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Курс не найден</h1>
      <Link to="/library/courses" className="btn-glass mt-6 inline-flex rounded-full px-5 py-2 text-sm">Все курсы</Link>
    </div>
  ),
  loader: async ({ params }) => {
    const course = await fetchCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.course.title} — HealthBlog` },
          { name: "description", content: loaderData.course.excerpt },
          { property: "og:title", content: loaderData.course.title },
          { property: "og:description", content: loaderData.course.excerpt },
          { property: "og:type", content: "article" },
          ...(loaderData.course.imageUrl
            ? [{ property: "og:image", content: loaderData.course.imageUrl }]
            : []),
        ]
      : [],
  }),
});

const levelColor: Record<string, string> = {
  "Новичок":     "bg-emerald-400/25 text-emerald-800 ring-emerald-400/40",
  "Средний":     "bg-amber-400/25 text-amber-800 ring-amber-400/40",
  "Продвинутый": "bg-rose-400/25 text-rose-800 ring-rose-400/40",
};

function CoursePage() {
  const { course } = Route.useLoaderData();
  const [related, setRelated] = useState<Course[]>([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId]   = useState<string | null>(null);

  useEffect(() => {
    fetchRelatedCourses(course.slug).then(setRelated);

    // Проверяем залогинен ли пользователь и начинал ли курс
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      supabase.from("course_progress")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("course_slug", course.slug)
        .single()
        .then(({ data }) => { if (data) setStarted(true); });
    });
  }, [course.slug]);

  const handleStart = async () => {
    if (!userId) {
      // Не залогинен — редирект на логин
      window.location.href = "/login";
      return;
    }
    if (started) return;
    setLoading(true);
    await supabase.from("course_progress").insert({
      user_id: userId,
      course_slug: course.slug,
    });
    setStarted(true);
    setLoading(false);
  };

  return (
    <article className="space-y-10">
      <Link to="/library/courses" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Все курсы
      </Link>

      <header className="glass-strong rounded-[28px] p-8 sm:p-12">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[#22c55e]/25 px-3 py-1 text-[#15803d] ring-1 ring-[#22c55e]/40">
            {course.category}
          </span>
          <span className={`rounded-full px-3 py-1 ring-1 ${levelColor[course.level] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
            {course.level}
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <BookOpen className="h-3.5 w-3.5" /> {course.lessons} уроков
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <Clock className="h-3.5 w-3.5" /> {course.weeks} нед.
          </span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-5xl font-semibold leading-tight text-slate-900">
          {course.title}
        </h1>
        <p className="mt-4 text-lg text-on-glass">{course.excerpt}</p>

        <div className="mt-6 flex items-center gap-2 text-sm text-slate-700">
          <User className="h-4 w-4" /> Автор · {course.author}
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${
            started
              ? "bg-[#22c55e]/20 text-[#15803d] ring-1 ring-[#22c55e]/40 cursor-default"
              : "btn-glass hover:bg-[#22c55e]/20"
          } disabled:opacity-50`}
        >
          {started
            ? <><CheckCircle className="h-4 w-4" /> Курс начат</>
            : <><PlayCircle className="h-4 w-4" /> {loading ? "Загрузка..." : "Начать курс"}</>}
        </button>
      </header>

      {/* Фото или градиент */}
      <div className={`h-64 sm:h-80 rounded-[28px] relative overflow-hidden ${!course.imageUrl ? `bg-gradient-to-br ${course.gradient}` : ""}`}>
        {course.imageUrl
          ? <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover" />
          : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {!course.imageUrl && <GraduationCap className="absolute bottom-6 right-8 h-20 w-20 text-white/30" />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Уроков",  value: course.lessons },
          { label: "Недель",  value: course.weeks },
          { label: "Уровень", value: course.level },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 text-center">
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-on-glass">{s.label}</p>
          </div>
        ))}
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-semibold text-slate-900">Похожие курсы</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c, i) => (
              <Link
                key={c.slug}
                to="/course/$slug"
                params={{ slug: c.slug }}
                className="glass glass-hover animate-fade-up group relative overflow-hidden rounded-[20px] p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`mb-4 h-40 rounded-2xl relative overflow-hidden ${!c.imageUrl ? `bg-gradient-to-br ${c.gradient}` : ""}`}>
                  {c.imageUrl
                    ? <img src={c.imageUrl} alt={c.title} className="h-full w-full object-cover" />
                    : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/15 px-3 py-1 text-xs text-slate-900 backdrop-blur-md ring-1 ring-white/20">
                    {c.category}
                  </span>
                  {!c.imageUrl && <GraduationCap className="absolute bottom-3 right-3 h-8 w-8 text-white/70" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 leading-snug group-hover:text-[#15803d] transition-colors">{c.title}</h3>
                <p className="mt-2 text-sm text-on-glass line-clamp-2">{c.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {c.lessons} уроков</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {c.weeks} нед.</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}