import { supabase } from "./supabase";

export type CourseCategory = string;

export interface Course {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  lessons: number;
  weeks: number;
  level: string;
  author: string;
  gradient: string;
  imageUrl?: string | null;
}

const COURSE_SELECT = `
  slug, title, excerpt, lessons, weeks, level, gradient, image_url,
  article_categories ( name ),
  authors ( name )
`;

function mapCourse(c: any): Course {
  return {
    slug:     c.slug,
    title:    c.title,
    excerpt:  c.excerpt,
    category: c.article_categories?.name ?? "",
    lessons:  c.lessons,
    weeks:    c.weeks,
    level:    c.level,
    author:   c.authors?.name ?? "",
    gradient: c.gradient ?? "from-emerald-400/40 to-teal-600/40",
    imageUrl: c.image_url ?? null,
  };
}

export async function fetchCourses(): Promise<Course[]> {
  if (!supabase) return []; 
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCourse);
}

export async function fetchCourseCategories(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("courses")
    .select("article_categories ( name )");
  if (error) return [];
  const names = (data ?? []).map((c: any) => c.article_categories?.name).filter(Boolean);
  return [...new Set(names)] as string[];
}

export async function fetchCourseBySlug(slug: string): Promise<Course | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapCourse(data);
}

export async function fetchRelatedCourses(slug: string, limit = 3): Promise<Course[]> {
  if (!supabase) return [];
  const { data: current } = await supabase
    .from("courses").select("category_id").eq("slug", slug).single();
  if (!current) return [];
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("category_id", (current as any).category_id)
    .neq("slug", slug)
    .limit(limit);
  if (error) return [];
  return (data ?? []).map(mapCourse);
}