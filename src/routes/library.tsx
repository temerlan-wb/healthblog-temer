import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Библиотека — HealthBlog" },
      { name: "description", content: "Статьи и курсы по тренировкам, питанию, реабилитации и сну." },
    ],
  }),
  component: LibraryLayout,
});

const tabs = [
  { to: "/library/articles", label: "Статьи" },
  { to: "/library/courses", label: "Курсы" },
] as const;

function LibraryLayout() {
  const { pathname } = useLocation();

  return (
    <div className="space-y-8">
      <header className="glass-strong rounded-[28px] p-8 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Библиотека</h1>
        <p className="mt-2 text-on-glass">
          Выберите формат — короткие статьи или системные курсы — и направление.
        </p>
        <div className="mt-6 inline-flex rounded-full glass p-1">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#22c55e]/30 text-slate-900 ring-1 ring-[#22c55e]/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
