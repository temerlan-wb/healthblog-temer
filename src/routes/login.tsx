import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход — HealthBlog" },
      { name: "description", content: "Войдите в свой аккаунт HealthBlog." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Неверный email или пароль");
    } else {
      navigate({ to: "/" });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="glass-strong relative overflow-hidden rounded-[28px] p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#22c55e]/30 blur-3xl" />
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#22c55e]/25 ring-1 ring-[#22c55e]/40">
            <LogIn className="h-5 w-5 text-[#15803d]" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">С возвращением</h1>
          <p className="mt-1 text-on-glass">Войдите, чтобы продолжить читать и сохранять статьи.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Mail className="h-4 w-4" /> Email
              </span>
              <input type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass mt-2 w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50"
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Lock className="h-4 w-4" /> Пароль
              </span>
              <input type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass mt-2 w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50"
              />
            </label>
            
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-[#15803d] hover:underline">
                Забыли пароль?
              </Link>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={loading}
              className="btn-glass w-full rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50">
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-glass">
            Нет аккаунта?{" "}
            <Link to="/register" className="font-medium text-[#15803d] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}