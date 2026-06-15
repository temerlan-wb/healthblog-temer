import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  User, Target, Activity, Bookmark,
  ChevronLeft, ChevronRight, Check, ArrowRight, Zap, Leaf,
  Camera, Lock, Save, BarChart2, Settings,
} from "lucide-react";
import { fetchArticles, type Article } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { useBookmarks } from "@/lib/bookmarks";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Профиль — HealthBlog" },
      { name: "description", content: "Ваши закладки, цели и активность." },
    ],
  }),
  component: ProfilePage,
});

export type WorkoutType = "strength" | "cardio" | "yoga";

export interface WorkoutSession {
  id: number;
  title: string;
  subtitle: string | null;
  type: WorkoutType;
  duration: number;
  scheduled_at: string;
  completed: boolean;
}

const ACTIVITIES = ["Бег", "Силовые", "Йога", "Велосипед", "Плавание"];
const GOALS      = ["Похудеть", "Набрать массу", "Поддерживать форму", "Больше энергии", "Лучше спать"];

const DOT_COLOR: Record<WorkoutType, string> = {
  strength: "bg-emerald-500",
  cardio:   "bg-teal-400",
  yoga:     "bg-sky-400",
};

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_RU   = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

async function fetchWorkoutSessions(userId: string, year: number, month: number): Promise<WorkoutSession[]> {
  if (!supabase) return [];
  const from = new Date(year, month, 1).toISOString();
  const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, title, subtitle, type, duration, scheduled_at")
    .eq("user_id", userId)
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .order("scheduled_at");
  if (sErr || !sessions) return [];
  const sessionIds = sessions.map((s) => s.id);
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("workout_session_id")
    .eq("user_id", userId)
    .in("workout_session_id", sessionIds);
  const completedIds = new Set((logs ?? []).map((l: any) => l.workout_session_id));
  return sessions.map((s: any) => ({ ...s, completed: completedIds.has(s.id) }));
}

async function toggleSessionComplete(userId: string, session: WorkoutSession) {
  if (!supabase) return;
  if (session.completed) {
    await supabase.from("workout_logs").delete()
      .eq("user_id", userId).eq("workout_session_id", session.id);
  } else {
    await supabase.from("workout_logs")
      .insert({ user_id: userId, workout_session_id: session.id, type: session.type });
  }
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number)    { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function MiniCalendar({ sessions }: { sessions: WorkoutSession[] }) {
  const now = new Date();
  const [cur, setCur] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const dim      = getDaysInMonth(cur.year, cur.month);
  const firstDow = getFirstDow(cur.year, cur.month);
  const prev = () => setCur((c) => c.month === 0  ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCur((c) => c.month === 11 ? { year: c.year + 1, month: 0  } : { ...c, month: c.month + 1 });
  const dotMap = new Map<number, WorkoutType>();
  sessions.forEach((s) => {
    const d = new Date(s.scheduled_at);
    if (d.getFullYear() === cur.year && d.getMonth() === cur.month) dotMap.set(d.getDate(), s.type);
  });
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let i = 1; i <= dim; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);
  const isCurrentMonth = cur.year === now.getFullYear() && cur.month === now.getMonth();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#22c55e]/10 transition text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-medium text-slate-700">{MONTHS_RU[cur.month]} {cur.year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#22c55e]/10 transition text-slate-500"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {DAYS_RU.map((d) => <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return (
            <div key={`e-${i}`} className="flex flex-col items-center py-0.5">
              <span className="text-xs w-7 h-7 flex items-center justify-center text-slate-300" />
              <span className="w-1.5 h-1.5 mt-0.5" />
            </div>
          );
          const isToday = isCurrentMonth && day === now.getDate();
          const dot = dotMap.get(day);
          return (
            <div key={day} className="flex flex-col items-center py-0.5">
              <span className={`text-xs w-7 h-7 flex items-center justify-center rounded-full transition ${isToday ? "bg-[#16a34a] text-white font-semibold" : "text-slate-700 hover:bg-[#22c55e]/10 cursor-pointer"}`}>{day}</span>
              {dot ? <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${DOT_COLOR[dot]}`} /> : <span className="w-1.5 h-1.5 mt-0.5" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Силовая</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Кардио</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Йога</span>
      </div>
    </div>
  );
}

function SessionIcon({ type }: { type: WorkoutType }) {
  if (type === "yoga") return <Leaf className="w-4 h-4 text-sky-500" />;
  return <Zap className={`w-4 h-4 ${type === "strength" ? "text-[#15803d]" : "text-teal-500"}`} />;
}

function SessionRow({ s, onToggle }: { s: WorkoutSession; onToggle: (s: WorkoutSession) => void }) {
  const d    = new Date(s.scheduled_at);
  const day  = d.getDate();
  const dow  = DAYS_RU[(d.getDay() + 6) % 7];
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return (
    <button onClick={() => onToggle(s)} className={`w-full text-left flex items-center gap-3 rounded-2xl px-4 py-3 transition ${s.completed ? "bg-[#22c55e]/10 border border-[#22c55e]/20" : "glass hover:bg-white/80"}`}>
      <div className="w-10 text-center flex-shrink-0">
        <div className="text-base font-bold text-slate-800 leading-none">{day}.</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{dow}</div>
      </div>
      <SessionIcon type={s.type} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{s.title}</div>
        {s.subtitle && <div className="text-xs text-slate-400 truncate">{s.subtitle}</div>}
      </div>
      <div className="flex-shrink-0">
        {s.completed ? <Check className="w-4 h-4 text-[#15803d]" /> : <ArrowRight className="w-4 h-4 text-slate-300" />}
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-xs font-medium text-slate-600">{s.duration} мин</div>
        <div className="text-xs text-slate-400">{time}</div>
      </div>
    </button>
  );
}

function ProfilePage() {
  const { bookmarks } = useBookmarks();
  const [userId, setUserId]           = useState<string | null>(null);
  const [email, setEmail]             = useState("");
  const [name, setName]               = useState("");
  const [goal, setGoal]               = useState(GOALS[2]);
  const [activity, setActivity]       = useState(ACTIVITIES[1]);
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null);
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg]         = useState<string | null>(null);
  const [savingPassword, setSavingPassword]   = useState(false);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [sessions, setSessions]       = useState<WorkoutSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const now = new Date();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      supabase.from("users").select("name, goal, activity, avatar_url")
        .eq("id", session.user.id).single()
        .then(({ data }) => {
          if (!data) return;
          if (data.name)       setName(data.name);
          if (data.goal)       setGoal(data.goal);
          if (data.activity)   setActivity(data.activity);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        });
    });
  }, []);

  useEffect(() => {
    if (bookmarks.length > 0) {
      setLoadingArticles(true);
      fetchArticles().then((arts) => {
        setAllArticles(arts);
        setLoadingArticles(false);
      });
    }
  }, [bookmarks.length]);

  useEffect(() => {
    if (!userId) { setLoadingSessions(false); return; }
    setLoadingSessions(true);
    fetchWorkoutSessions(userId, now.getFullYear(), now.getMonth())
      .then(setSessions).finally(() => setLoadingSessions(false));
  }, [userId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    setProfileSaved(false);
    let newAvatarUrl = avatarUrl;
    if (avatarFile) {
      const ext  = avatarFile.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;
      await supabase.storage.from("images").upload(path, avatarFile, { upsert: true });
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      newAvatarUrl = data.publicUrl;
    }
    await supabase.from("users").update({ name, goal, activity, avatar_url: newAvatarUrl }).eq("id", userId);
    setAvatarUrl(newAvatarUrl);
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileSaved(true);
    setSavingProfile(false);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { setPasswordMsg("Пароли не совпадают"); return; }
    if (newPassword.length < 8) { setPasswordMsg("Минимум 8 символов"); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMsg("Ошибка: " + error.message);
    else {
      setPasswordMsg("Пароль изменён!");
      setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 3000);
    }
    setSavingPassword(false);
  };

  const handleToggle = async (s: WorkoutSession) => {
    if (!userId) return;
    setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, completed: !x.completed } : x));
    await toggleSessionComplete(userId, s);
  };

  const savedArticles = allArticles.filter((a) => bookmarks.includes(a.slug));
  const completedSessions = sessions.filter(s => s.completed).length;

  return (
    <div className="space-y-10">

      {/* ── Profile header ────────────────────────────── */}
      <header className="glass-strong relative overflow-hidden rounded-[28px] p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#22c55e]/30 blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="h-20 w-20 rounded-2xl bg-[#22c55e]/25 ring-1 ring-[#22c55e]/40 overflow-hidden cursor-pointer hover:opacity-80 transition flex items-center justify-center"
            >
              {avatarPreview || avatarUrl
                ? <img src={avatarPreview ?? avatarUrl!} alt="avatar" className="h-full w-full object-cover" />
                : <User className="h-8 w-8 text-[#15803d]" />}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#22c55e] ring-1 ring-white"
            >
              <Camera className="h-3 w-3 text-white" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-3xl font-semibold text-slate-900">{name || "Ваш профиль"}</h1>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{email}</p>
            <p className="mt-1 text-on-glass flex flex-wrap items-center gap-1.5">
              Цель: <span className="text-slate-900">{goal}</span>
              <span className="text-slate-400">·</span>
              Активность:{" "}
              <span className="inline-flex items-center rounded-full bg-[#22c55e]/20 text-[#15803d] text-xs font-medium px-2.5 py-0.5 ring-1 ring-[#22c55e]/30">{activity}</span>
            </p>
          </div>
        </div>
      </header>

      {/* ── Статистика ────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { icon: <Bookmark className="h-5 w-5 text-[#15803d]" />,  value: bookmarks.length,   label: "Закладок" },
          { icon: <Check className="h-5 w-5 text-[#15803d]" />,     value: completedSessions,  label: "Тренировок" },
          { icon: <BarChart2 className="h-5 w-5 text-[#15803d]" />, value: sessions.length,    label: "Запланировано" },
        ].map(({ icon, value, label }) => (
          <div key={label} className="glass rounded-2xl p-5 flex flex-col items-center gap-1">
            {icon}
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </section>

      {/* ── Calendar + Workout plan ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-700">
            <span className="text-base">📅</span> Календарь
          </div>
          <MiniCalendar sessions={sessions} />
        </section>
        <section className="glass rounded-2xl p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            План тренировок
            {!loadingSessions && sessions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">{completedSessions}/{sessions.length} выполнено</span>
            )}
          </h2>
          {loadingSessions ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-16 animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">Тренировок на этот месяц нет</div>
          ) : (
            <div className="space-y-2">{sessions.map(s => <SessionRow key={s.id} s={s} onToggle={handleToggle} />)}</div>
          )}
        </section>
      </div>

      {/* ── Настройки профиля ─────────────────────────── */}
      <section className="glass-strong rounded-[28px] p-8 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Настройки профиля</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2"><User className="h-4 w-4" /> Имя</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Алекс"
              className="glass w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2"><Target className="h-4 w-4" /> Цель</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} onClick={() => setGoal(g)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${goal === g ? "bg-[#22c55e]/30 text-slate-900 ring-1 ring-[#22c55e]/50" : "bg-white/10 text-slate-600 hover:bg-white/20"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2"><Activity className="h-4 w-4" /> Активность</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map(a => (
                <button key={a} onClick={() => setActivity(a)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${activity === a ? "bg-[#22c55e]/30 text-slate-900 ring-1 ring-[#22c55e]/50" : "bg-white/10 text-slate-600 hover:bg-white/20"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveProfile} disabled={savingProfile}
            className="flex items-center gap-2 rounded-full bg-[#22c55e]/30 px-5 py-2 text-sm text-slate-900 ring-1 ring-[#22c55e]/50 hover:bg-[#22c55e]/40 transition disabled:opacity-50">
            <Save className="h-4 w-4" />
            {savingProfile ? "Сохранение..." : "Сохранить"}
          </button>
          {profileSaved && <span className="text-sm text-[#15803d]">✓ Сохранено</span>}
        </div>
      </section>

      {/* ── Смена пароля ──────────────────────────────── */}
      <section className="glass-strong rounded-[28px] p-8 space-y-4 max-w-md">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#15803d]" /> Смена пароля
        </h2>
        <div className="space-y-3">
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новый пароль"
            className="glass w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50" />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Повторите пароль"
            className="glass w-full rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 outline-none focus:ring-2 focus:ring-[#22c55e]/50" />
        </div>
        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.includes("изменён") ? "text-[#15803d]" : "text-red-500"}`}>{passwordMsg}</p>
        )}
        <button onClick={savePassword} disabled={savingPassword || !newPassword}
          className="flex items-center gap-2 rounded-full bg-[#22c55e]/30 px-5 py-2 text-sm text-slate-900 ring-1 ring-[#22c55e]/50 hover:bg-[#22c55e]/40 transition disabled:opacity-50">
          <Lock className="h-4 w-4" />
          {savingPassword ? "Сохранение..." : "Изменить пароль"}
        </button>
      </section>

      {/* ── Закладки ──────────────────────────────────── */}
<section>
  <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold text-slate-900">
    <Bookmark className="h-5 w-5 text-[#15803d]" /> Закладки
    <span className="text-base font-normal text-slate-900/60">· {bookmarks.length}</span>
  </h2>
  {bookmarks.length === 0 ? (
    <div className="glass rounded-2xl p-10 text-center text-on-glass">Пока пусто. Сохраняйте статьи — они появятся здесь.</div>
  ) : loadingArticles ? (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: Math.min(bookmarks.length, 3) }).map((_, i) => (
        <div key={i} className="glass rounded-[20px] h-64 animate-pulse" />
      ))}
    </div>
  ) : savedArticles.length === 0 ? (
    <div className="glass rounded-2xl p-10 text-center text-on-glass">
      Статьи загружаются...
    </div>
  ) : (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {savedArticles.map((a, i) => (
        <ArticleCard key={a.slug} article={a} index={i} />
      ))}
    </div>
  )}
</section>
    </div>
  );
}