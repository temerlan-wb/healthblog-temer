  import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
  import { useState, type FormEvent } from "react";
  import { User, Mail, Lock, UserPlus } from "lucide-react";
  import { supabase } from "@/lib/supabase";

  export const Route = createFileRoute("/register")({
    head: () => ({
      meta: [{ title: "Регистрация — HealthBlog" }],
    }),
    component: RegisterPage,
  });

  function RegisterPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

// заменить весь onSubmit
const onSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    setError(signUpError.message);
    setLoading(false);
    return;
  }

  if (data.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      name,
      email,
    });
  }

  setSuccess(true); // показать сообщение об успехе
  setLoading(false);
  // navigate убираем — пусть сначала подтвердит email
};

    return (
      <div className="mx-auto max-w-md">
        <div className="glass-strong relative overflow-hidden rounded-[28px] p-8 sm:p-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#22c55e]/25 ring-1 ring-[#22c55e]/40">
              <UserPlus className="h-5 w-5 text-[#15803d]" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-slate-900">Создать аккаунт</h1>
            <p className="mt-1 text-on-glass">Сохраняйте статьи и отслеживайте прогресс.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {[
                { label: "Имя", icon: <User className="h-4 w-4" />, type: "text", value: name, set: setName, placeholder: "Алекс" },
                { label: "Email", icon: <Mail className="h-4 w-4" />, type: "email", value: email, set: setEmail, placeholder: "you@example.com" },
                { label: "Пароль", icon: <Lock className="h-4 w-4" />, type: "password", value: password, set: setPassword, placeholder: "Минимум 8 символов" },
              ].map(({ label, icon, type, value, set, placeholder }) => (
                <label key={label} className="block">
                  <span className="flex items-center gap-2 text-sm text-slate-700">{icon} {label}</span>
                  <input type={type} required value={value}
                    onChange={e => set(e.target.value)} placeholder={placeholder}
                    className="glass mt-2 w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50"
                  />
                </label>
              ))}

              {success && (
                <p className="text-sm text-emerald-600 font-medium">
                  ✓ Проверьте почту и подтвердите email для входа
                </p>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-glass w-full rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Создаём..." : "Зарегистрироваться"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-on-glass">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="font-medium text-[#15803d] hover:underline">Войти</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }