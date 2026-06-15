import { useState } from "react";
import { Sparkles } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="glass-strong relative overflow-hidden rounded-[28px] p-8 sm:p-12">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#22c55e]/30 blur-3xl" />
      <div className="relative max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-700 ring-1 ring-white/20">
          <Sparkles className="h-3.5 w-3.5 text-[#15803d]" /> Раз в неделю, без спама
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Подписка на короткий дайджест о здоровье
        </h2>
        <p className="mt-2 text-on-glass">
          Лучшие материалы недели — тренировки, питание, восстановление. Без воды.
        </p>

        {done ? (
          <p className="mt-6 rounded-2xl bg-[#22c55e]/15 px-4 py-3 text-slate-900 ring-1 ring-[#22c55e]/40">
            Готово! Проверьте почту — мы отправили приветствие.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes("@")) setDone(true);
            }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="glass flex-1 rounded-full px-5 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#22c55e]/50"
            />
            <button type="submit" className="btn-glass rounded-full px-6 py-3 text-sm font-medium">
              Подписаться
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
