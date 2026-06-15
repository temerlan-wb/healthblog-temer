import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Plus, Trash2, Pencil, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (!supabase) throw redirect({ to: "/" });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const { data: user } = await supabase
      .from("users").select("is_admin").eq("id", session.user.id).single();
    if (!user?.is_admin) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

function AdminPage() {
  const [tab, setTab] = useState<"articles" | "courses">("articles");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Админ-панель</h1>
      <div className="flex gap-2">
        {(["articles", "courses"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${
              tab === t ? "bg-[#22c55e]/30 text-slate-900 ring-1 ring-[#22c55e]/50" : "glass text-slate-700"
            }`}>
            {t === "articles" ? "Статьи" : "Курсы"}
          </button>
        ))}
      </div>
      {tab === "articles" ? <ArticlesTab /> : <CoursesTab />}
    </div>
  );
}

// ─── Articles Tab ─────────────────────────────────────────────

function ArticlesTab() {
  const [articles, setArticles] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    supabase?.from("articles")
      .select("id, title, slug, published_at, article_categories(name)")
      .order("published_at", { ascending: false })
      .then(({ data }) => setArticles(data ?? []));
  }, [refresh]);

  const deleteArticle = async (id: string) => {
    if (!confirm("Удалить статью?")) return;
    await supabase?.from("article_paragraphs").delete().eq("article_id", id);
    await supabase?.from("articles").delete().eq("id", id);
    setRefresh(r => r + 1);
  };

  const handleEdit = (id: string) => {
    // Сначала закрываем форму, потом открываем с новым id —
    // это гарантирует пересоздание компонента и сброс состояния
    setShowForm(false);
    setEditingId(null);
    setTimeout(() => {
      setEditingId(id);
      setShowForm(true);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-[28px] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Опубликованные статьи</h2>
          <button onClick={() => { setShowForm(f => !f); setEditingId(null); }}
            className="flex items-center gap-2 rounded-full bg-[#22c55e]/30 px-4 py-1.5 text-sm text-slate-900 ring-1 ring-[#22c55e]/50 hover:bg-[#22c55e]/40 transition">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Закрыть" : "Новая статья"}
          </button>
        </div>
        {articles.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Статей пока нет</p>
        ) : (
          <div className="space-y-2">
            {articles.map(a => (
              <div key={a.id} className="glass flex items-center justify-between rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.article_categories?.name} · {a.slug}</p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => handleEdit(a.id)}
                    className="glass rounded-xl p-2 text-slate-500 hover:text-slate-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteArticle(a.id)}
                    className="glass rounded-xl p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        // key гарантирует пересоздание компонента при смене editingId
        <ArticleForm
          key={editingId ?? "new"}
          editingId={editingId}
          onSaved={() => { setRefresh(r => r + 1); setShowForm(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

// ─── Article Form ─────────────────────────────────────────────

function ArticleForm({ editingId, onSaved }: { editingId: string | null; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [readTime, setReadTime] = useState(5);
  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [paragraphs, setParagraphs] = useState([""]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase?.from("article_categories").select("id, name").then(({ data }) => setCategories(data ?? []));
    supabase?.from("authors").select("id, name").then(({ data }) => setAuthors(data ?? []));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    supabase?.from("articles")
      .select("*, article_paragraphs(position, body)")
      .eq("id", editingId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setTitle(data.title ?? "");
        setSlug(data.slug ?? "");
        setExcerpt(data.excerpt ?? "");
        setReadTime(data.read_time ?? 5);
        setCategoryId(data.category_id ?? "");
        setAuthorId(data.author_id ?? "");
        setSlugManual(true);
        if (data.image_url) setPreview(data.image_url);
        const sorted = [...(data.article_paragraphs ?? [])]
          .sort((a: any, b: any) => a.position - b.position)
          .map((p: any) => p.body);
        setParagraphs(sorted.length ? sorted : [""]);
      });
  }, [editingId]);

  useEffect(() => {
    if (slugManual) return;
    setSlug(title.toLowerCase()
      .replace(/[а-яё]/g, c => ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" }[c] ?? c))
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }, [title, slugManual]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!supabase || !title || !slug) return;
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const { error: updErr } = await supabase.from("articles").update({
          title, slug, excerpt,
          read_time: readTime,
          category_id: categoryId || null,
          author_id: authorId || null,
        }).eq("id", editingId);
        if (updErr) throw new Error(updErr.message);

        // Удаляем старые параграфы и вставляем новые
        const { error: delErr } = await supabase
          .from("article_paragraphs").delete().eq("article_id", editingId);
        if (delErr) throw new Error(delErr.message);

        const rows = paragraphs.filter(p => p.trim()).map((body, i) => ({
          article_id: editingId, position: i + 1, body,
        }));
        if (rows.length) {
          const { error: insErr } = await supabase.from("article_paragraphs").insert(rows);
          if (insErr) throw new Error(insErr.message);
        }

        if (image) {
          const ext = image.name.split(".").pop();
          const path = `articles/${editingId}.${ext}`;
          await supabase.storage.from("images").upload(path, image, { upsert: true });
          const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
          await supabase.from("articles").update({ image_url: urlData.publicUrl }).eq("id", editingId);
        }
      } else {
        const { data: article, error: insErr } = await supabase.from("articles").insert({
          title, slug, excerpt,
          read_time: readTime,
          category_id: categoryId || null,
          author_id: authorId || null,
          published_at: new Date().toISOString(),
        }).select("id").single();
        if (insErr || !article) throw new Error(insErr?.message ?? "Ошибка создания");

        if (image) {
          const ext = image.name.split(".").pop();
          const path = `articles/${article.id}.${ext}`;
          await supabase.storage.from("images").upload(path, image, { upsert: true });
          const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
          await supabase.from("articles").update({ image_url: urlData.publicUrl }).eq("id", article.id);
        }

        const rows = paragraphs.filter(p => p.trim()).map((body, i) => ({
          article_id: article.id, position: i + 1, body,
        }));
        if (rows.length) {
          const { error: pErr } = await supabase.from("article_paragraphs").insert(rows);
          if (pErr) throw new Error(pErr.message);
        }
      }

      toast.success(editingId ? "Изменения сохранены" : "Статья опубликована", {
        style: { background: "#22c55e", color: "#fff", border: "1px solid #16a34a" },
      });
      onSaved();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Неизвестная ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-strong rounded-[28px] p-8 space-y-5 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900">
        {editingId ? "Редактировать статью" : "Новая статья"}
      </h2>

      <div>
        <label className="text-sm text-slate-600">Заголовок</label>
        <input value={title} onChange={e => { setTitle(e.target.value); setSlugManual(false); }}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
      </div>

      <div>
        <label className="text-sm text-slate-600">Slug (URL)</label>
        <input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
      </div>

      <div>
        <label className="text-sm text-slate-600">Краткое описание</label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-slate-600">Категория</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/80 px-4 py-2 text-slate-900 outline-none">
            <option value="">— выбрать —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-slate-600">Автор</label>
          <select value={authorId} onChange={e => setAuthorId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/80 px-4 py-2 text-slate-900 outline-none">
            <option value="">— выбрать —</option>
            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="w-24">
          <label className="text-sm text-slate-600">Мин. чтения</label>
          <input type="number" value={readTime} onChange={e => setReadTime(+e.target.value)} min={1}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-600">Обложка</label>
        {preview && (
          <div className="relative mt-3 mb-3">
            <img src={preview} alt="" className="h-40 w-full object-cover rounded-xl" />
            <button type="button" onClick={() => { setPreview(null); setImage(null); }}
              className="absolute top-2 right-2 glass rounded-full p-1.5 text-slate-700 hover:text-red-500 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <label className="mt-1 flex cursor-pointer items-center gap-2 glass rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:text-slate-900 transition w-fit">
          <Upload className="h-4 w-4" />
          {preview ? "Заменить обложку" : "Загрузить обложку"}
          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-slate-600">Параграфы контента</label>
        {paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <textarea value={p} rows={3}
              onChange={e => setParagraphs(prev => prev.map((x, j) => j === i ? e.target.value : x))}
              placeholder={`Параграф ${i + 1}`}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
            {paragraphs.length > 1 && (
              <button onClick={() => setParagraphs(prev => prev.filter((_, j) => j !== i))}
                className="glass rounded-xl p-2 text-red-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => setParagraphs(p => [...p, ""])}
          className="glass flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-slate-700">
          <Plus className="h-4 w-4" /> Добавить параграф
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 ring-1 ring-red-500/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={save} disabled={saving || !title || !slug}
          className="flex items-center gap-2 rounded-full bg-[#22c55e]/30 px-6 py-2.5 text-slate-900 ring-1 ring-[#22c55e]/50 hover:bg-[#22c55e]/40 transition disabled:opacity-50">
          {editingId ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {saving ? "Сохранение..." : editingId ? "Сохранить изменения" : "Опубликовать статью"}
        </button>
        <button onClick={onSaved}
          className="glass rounded-full px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition">
          Отмена
        </button>
      </div>
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────

function CoursesTab() {
  const [courses, setCourses] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    supabase?.from("courses")
      .select("id, title, slug, level, article_categories(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCourses(data ?? []));
  }, [refresh]);

  const deleteCourse = async (id: string) => {
    if (!confirm("Удалить курс?")) return;
    await supabase?.from("courses").delete().eq("id", id);
    setRefresh(r => r + 1);
  };

  const handleEdit = (id: string) => {
    setShowForm(false);
    setEditingId(null);
    setTimeout(() => {
      setEditingId(id);
      setShowForm(true);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-[28px] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Опубликованные курсы</h2>
          <button onClick={() => { setShowForm(f => !f); setEditingId(null); }}
            className="flex items-center gap-2 rounded-full bg-[#22c55e]/30 px-4 py-1.5 text-sm text-slate-900 ring-1 ring-[#22c55e]/50 hover:bg-[#22c55e]/40 transition">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Закрыть" : "Новый курс"}
          </button>
        </div>
        {courses.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Курсов пока нет</p>
        ) : (
          <div className="space-y-2">
            {courses.map(c => (
              <div key={c.id} className="glass flex items-center justify-between rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.article_categories?.name} · {c.level} · {c.slug}</p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => handleEdit(c.id)}
                    className="glass rounded-xl p-2 text-slate-500 hover:text-slate-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteCourse(c.id)}
                    className="glass rounded-xl p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CourseForm
          key={editingId ?? "new"}
          editingId={editingId}
          onSaved={() => { setRefresh(r => r + 1); setShowForm(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

// ─── Course Form ──────────────────────────────────────────────

function CourseForm({ editingId, onSaved }: { editingId: string | null; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [lessons, setLessons] = useState(1);
  const [weeks, setWeeks] = useState(1);
  const [level, setLevel] = useState("Начальный");
  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase?.from("article_categories").select("id, name").then(({ data }) => setCategories(data ?? []));
    supabase?.from("authors").select("id, name").then(({ data }) => setAuthors(data ?? []));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    supabase?.from("courses").select("*").eq("id", editingId).single().then(({ data, error }) => {
      if (error || !data) return;
      setTitle(data.title ?? "");
      setSlug(data.slug ?? "");
      setExcerpt(data.excerpt ?? "");
      setLessons(data.lessons ?? 1);
      setWeeks(data.weeks ?? 1);
      setLevel(data.level ?? "Начальный");
      setCategoryId(data.category_id ?? "");
      setAuthorId(data.author_id ?? "");
      setSlugManual(true);
      if (data.image_url) setPreview(data.image_url);
    });
  }, [editingId]);

  useEffect(() => {
    if (slugManual) return;
    setSlug(title.toLowerCase()
      .replace(/[а-яё]/g, c => ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" }[c] ?? c))
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }, [title, slugManual]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!supabase || !title || !slug) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title, slug, excerpt, lessons, weeks, level,
        category_id: categoryId || null,
        author_id: authorId || null,
      };

      let courseId = editingId;

      if (editingId) {
        const { error: updErr } = await supabase.from("courses").update(payload).eq("id", editingId);
        if (updErr) throw new Error(updErr.message);
      } else {
        const { data: course, error: insErr } = await supabase
          .from("courses").insert(payload).select("id").single();
        if (insErr || !course) throw new Error(insErr?.message ?? "Ошибка создания");
        courseId = course.id;
      }

      if (image && courseId) {
        const ext = image.name.split(".").pop();
        const path = `courses/${courseId}.${ext}`;
        await supabase.storage.from("images").upload(path, image, { upsert: true });
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
        await supabase.from("courses").update({ image_url: urlData.publicUrl }).eq("id", courseId);
      }
      
      toast.success(editingId ? "Изменения сохранены" : "Курс опубликован", {
        style: { background: "#22c55e", color: "#fff", border: "1px solid #16a34a" },
      });
      onSaved();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Неизвестная ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-strong rounded-[28px] p-8 space-y-5 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900">
        {editingId ? "Редактировать курс" : "Новый курс"}
      </h2>

      {[
        { label: "Заголовок", value: title, set: (v: string) => { setTitle(v); setSlugManual(false); } },
        { label: "Slug (URL)", value: slug, set: (v: string) => { setSlug(v); setSlugManual(true); } },
      ].map(({ label, value, set }) => (
        <div key={label}>
          <label className="text-sm text-slate-600">{label}</label>
          <input value={value} onChange={e => set(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
        </div>
      ))}

      <div>
        <label className="text-sm text-slate-600">Краткое описание</label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-slate-600">Категория</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/80 px-4 py-2 text-slate-900 outline-none">
            <option value="">— выбрать —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-slate-600">Автор</label>
          <select value={authorId} onChange={e => setAuthorId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/80 px-4 py-2 text-slate-900 outline-none">
            <option value="">— выбрать —</option>
            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        {[
          { label: "Уроков", value: lessons, set: setLessons },
          { label: "Недель", value: weeks, set: setWeeks },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex-1">
            <label className="text-sm text-slate-600">{label}</label>
            <input type="number" value={value} min={1} onChange={e => set(+e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-900 outline-none" />
          </div>
        ))}
        <div className="flex-1">
          <label className="text-sm text-slate-600">Уровень</label>
          <select value={level} onChange={e => setLevel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/80 px-4 py-2 text-slate-900 outline-none">
            {["Начальный", "Средний", "Продвинутый"].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-600">Обложка</label>
        {preview && (
          <div className="relative mt-3 mb-3">
            <img src={preview} alt="" className="h-40 w-full object-cover rounded-xl" />
            <button type="button" onClick={() => { setPreview(null); setImage(null); }}
              className="absolute top-2 right-2 glass rounded-full p-1.5 text-slate-700 hover:text-red-500 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <label className="mt-1 flex cursor-pointer items-center gap-2 glass rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:text-slate-900 transition w-fit">
          <Upload className="h-4 w-4" />
          {preview ? "Заменить обложку" : "Загрузить обложку"}
          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 ring-1 ring-red-500/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={save} disabled={saving || !title || !slug}
          className="flex items-center gap-2 rounded-full bg-[#22c55e]/30 px-6 py-2.5 text-slate-900 ring-1 ring-[#22c55e]/50 hover:bg-[#22c55e]/40 transition disabled:opacity-50">
          {editingId ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {saving ? "Сохранение..." : editingId ? "Сохранить изменения" : "Опубликовать курс"}
        </button>
        <button onClick={onSaved}
          className="glass rounded-full px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition">
          Отмена
        </button>
      </div>
    </div>
  );
}