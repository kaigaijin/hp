import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

// 公開済みかどうか（dateが今日以前ならtrue）
function isPublished(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) <= today;
}

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  country: string;
  category: string;
  tags: string[];
  coverImage?: string;
};

export function getArticlesByCountry(countryCode: string): ArticleMeta[] {
  const dir = path.join(contentDir, countryCode);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
      const { data } = matter(raw);
      return {
        slug: filename.replace(".mdx", ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        country: countryCode,
        category: data.category ?? "",
        tags: data.tags ?? [],
        coverImage: data.coverImage,
      };
    })
    .filter((a) => isPublished(a.date))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getArticle(countryCode: string, slug: string) {
  const filePath = path.join(contentDir, countryCode, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  // 未公開記事はnullを返す
  if (!isPublished(data.date ?? "")) return null;

  return {
    meta: {
      slug,
      title: data.title ?? "",
      description: data.description ?? "",
      date: data.date ?? "",
      country: countryCode,
      category: data.category ?? "",
      tags: data.tags ?? [],
      coverImage: data.coverImage,
    } as ArticleMeta,
    content,
  };
}

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(contentDir)) return [];

  return fs
    .readdirSync(contentDir)
    .filter((d) => fs.statSync(path.join(contentDir, d)).isDirectory())
    .flatMap((country) => getArticlesByCountry(country))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}
