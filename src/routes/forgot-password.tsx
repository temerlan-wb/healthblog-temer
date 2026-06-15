import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Сброс пароля — HealthBlog" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    });

    if (error) {
      setError("Не удалось отправить письмо. Проверьте email.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="glass-strong relative overflow-hidden rounded-[28px] p-8 sm:p-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#22c55e]/30 blur-3xl" />
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#22c55e]/25 ring-1 ring-[#22c55e]/40">
            <KeyRound className="h-5 w-5 text-[#15803d]" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">Сброс пароля</h1>
          <p className="mt-1 text-on-glass">
            Введите email — пришлём ссылку для смены пароля.
          </p>

          {sent ? (
            <div className="mt-6 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 p-5 text-sm text-emerald-800">
              ✓ Письмо отправлено. Проверьте почту и перейдите по ссылке.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4" /> Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="glass mt-2 w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50"
                />
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-glass w-full rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Отправляем..." : "Отправить письмо"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-on-glass">
            Вспомнили пароль?{" "}
            <Link to="/login" className="font-medium text-[#15803d] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}