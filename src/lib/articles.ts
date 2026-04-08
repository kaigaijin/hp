import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

// 公開済みかどうか（dateが今日以前ならtrue）
// "2026-04-08" 形式の日付文字列をローカル日付として比較（タイムゾーンに依存しない）
function isPublished(date: string): boolean {
  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  return date <= todayStr;
}

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  lastModified?: string;
  country: string;
  category: string;
  tags: string[];
  coverImage?: string;
};

// content/{country}/{date}/*.mdx を再帰的に収集
function collectMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...collectMdxFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

export function getArticlesByCountry(countryCode: string): ArticleMeta[] {
  const dir = path.join(contentDir, countryCode);
  const files = collectMdxFiles(dir);

  return files
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      return {
        slug: path.basename(filePath).replace(".mdx", ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        lastModified: data.lastModified ?? undefined,
        country: countryCode,
        category: data.category ?? "",
        tags: data.tags ?? [],
        coverImage: data.coverImage,
      };
    })
    .filter((a) => isPublished(a.date))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

// slug からファイルパスを検索（日付フォルダを走査）
function findArticleFile(countryCode: string, slug: string): string | null {
  const dir = path.join(contentDir, countryCode);
  const files = collectMdxFiles(dir);
  return files.find((f) => path.basename(f) === `${slug}.mdx`) ?? null;
}

export function getArticle(countryCode: string, slug: string) {
  const filePath = findArticleFile(countryCode, slug);
  if (!filePath) return null;

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
      lastModified: data.lastModified ?? undefined,
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
