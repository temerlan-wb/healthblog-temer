import { supabase } from "./supabase";

export type Category =
  | "Тренировки"
  | "Похудение"
  | "Реабилитация"
  | "Питание"
  | "Восстановление"
  | "Сон"
  | "Ментальное";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  readTime: number;
  author: string;
  date: string;
  tags: string[];
  gradient: string;
  content: string[];
  imageUrl?: string | null;
}

export const categories: Category[] = [
  "Тренировки", "Похудение", "Реабилитация",
  "Питание", "Восстановление", "Сон", "Ментальное",
];

const ARTICLE_SELECT = `
  slug, title, excerpt, read_time, gradient, image_url, published_at,
  article_categories ( name ),
  authors ( name ),
  article_paragraphs ( position, body ),
  article_tags ( tags ( name ) )
`;

function mapArticle(row: any): Article {
  console.log("image_url:", row.image_url);
  return {
    slug:     row.slug,
    title:    row.title,
    excerpt:  row.excerpt,
    category: row.article_categories?.name as Category,
    readTime: row.read_time,
    author:   row.authors?.name ?? "",
    date:     formatDate(row.published_at),
    gradient: row.gradient ?? "from-emerald-400/40 to-teal-600/40",
    imageUrl: row.image_url ?? null,
    tags:     (row.article_tags ?? []).map((t: any) => t.tags?.name).filter(Boolean),
    content:  (row.article_paragraphs ?? [])
                .sort((a: any, b: any) => a.position - b.position)
                .map((p: any) => p.body),
  };
}

export async function fetchArticles(): Promise<Article[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("published_at", { ascending: false });
  if (error || !data) { console.error("fetchArticles error:", error); return []; }
  return data.map(mapArticle);
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapArticle(data);
}

export async function fetchRelated(slug: string, limit = 3): Promise<Article[]> {
  if (!supabase) return [];
  const { data: current } = await supabase
    .from("articles").select("category_id").eq("slug", slug).single();
  if (!current) return [];
  const { data, error } = await supabase
    .from("articles")
    .select(`slug, title, excerpt, read_time, gradient, image_url, published_at,
      article_categories ( name ), authors ( name ), article_tags ( tags ( name ) )`)
    .eq("category_id", current.category_id)
    .neq("slug", slug)
    .limit(limit);
  if (error || !data) return [];
  return data.map((row: any) => ({ ...mapArticle(row), content: [] }));
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export const fetchRelatedArticles = fetchRelated;

export async function fetchCategories(): Promise<string[]> {
  if (!supabase) return categories;
  const { data, error } = await supabase.from("article_categories").select("name").order("name");
  if (error || !data) return categories;
  return data.map((c: any) => c.name);
}