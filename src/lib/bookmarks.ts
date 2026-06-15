import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Залогинен → берём из БД
      const { data } = await supabase
        .from("bookmarks")
        .select("slug")
        .eq("user_id", session.user.id);
      setBookmarks((data ?? []).map(b => b.slug));
    } else {
      // Не залогинен → localStorage
      try {
        setBookmarks(JSON.parse(localStorage.getItem("healthblog:bookmarks") || "[]"));
      } catch { setBookmarks([]); }
    }
  };

  const toggle = async (slug: string) => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const exists = bookmarks.includes(slug);
      if (exists) {
        await supabase.from("bookmarks").delete()
          .eq("user_id", session.user.id).eq("slug", slug);
        setBookmarks(prev => prev.filter(s => s !== slug));
      } else {
        await supabase.from("bookmarks").insert({ user_id: session.user.id, slug });
        setBookmarks(prev => [...prev, slug]);
      }
    } else {
      // Не залогинен → localStorage
      const next = bookmarks.includes(slug)
        ? bookmarks.filter(s => s !== slug)
        : [...bookmarks, slug];
      localStorage.setItem("healthblog:bookmarks", JSON.stringify(next));
      setBookmarks(next);
    }
  };

  return { bookmarks, toggle, has: (slug: string) => bookmarks.includes(slug) };
}