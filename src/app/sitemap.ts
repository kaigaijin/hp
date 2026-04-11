import { MetadataRoute } from "next";
import { countries } from "@/lib/countries";
import { getAllArticles, getReturnArticles } from "@/lib/articles";
import { categories, getAllplaces } from "@/lib/directory";
import { JOB_INDUSTRIES, getAllJobs } from "@/lib/jobs";

const BASE_URL = "https://kaigaijin.jp";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // トップページ
  entries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  });

  // 固定ページ
  entries.push({
    url: `${BASE_URL}/contact`,
    changeFrequency: "monthly",
    priority: 0.3,
  });

  entries.push({
    url: `${BASE_URL}/advertise`,
    changeFrequency: "monthly",
    priority: 0.3,
  });

  entries.push({
    url: `${BASE_URL}/visa-simulator`,
    changeFrequency: "monthly",
    priority: 0.8,
  });

  // 国ページ
  for (const country of countries) {
    entries.push({
      url: `${BASE_URL}/${country.code}/column`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // スポット カテゴリ一覧
    const places = getAllplaces(country.code);
    if (places.length > 0) {
      entries.push({
        url: `${BASE_URL}/${country.code}/place`,
        changeFrequency: "weekly",
        priority: 0.7,
      });

      // スポット カテゴリ別一覧（3件以上のカテゴリのみ）
      for (const cat of categories) {
        const catplaces = places.filter((s) => s.category === cat.slug);
        if (catplaces.length >= 3) {
          entries.push({
            url: `${BASE_URL}/${country.code}/place/${cat.slug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }

      // スポット 個別ページ
      for (const place of places) {
        entries.push({
          url: `${BASE_URL}/${country.code}/place/${place.category}/${place.slug}`,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    }
  }

  // 求人ページ（Supabase経由: 非同期）
  for (const country of countries) {
    const jobs = await getAllJobs(country.code);
    if (jobs.length > 0) {
      entries.push({
        url: `${BASE_URL}/${country.code}/jobs`,
        changeFrequency: "weekly",
        priority: 0.7,
      });

      // 業種別一覧（1件以上の業種のみ）
      for (const ind of JOB_INDUSTRIES) {
        const indJobs = jobs.filter((j) => j.industry === ind.slug);
        if (indJobs.length >= 1) {
          entries.push({
            url: `${BASE_URL}/${country.code}/jobs/${ind.slug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }

      // 求人詳細ページ
      for (const job of jobs) {
        entries.push({
          url: `${BASE_URL}/${country.code}/jobs/${job.industry}/${job.slug}`,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    }
  }

  // 記事ページ
  const articles = getAllArticles();
  for (const article of articles) {
    entries.push({
      url: `${BASE_URL}/${article.country}/column/${article.slug}`,
      lastModified: new Date(article.lastModified ?? article.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // 帰国準備ガイド
  entries.push({
    url: `${BASE_URL}/return`,
    changeFrequency: "weekly",
    priority: 0.8,
  });
  for (const article of getReturnArticles()) {
    entries.push({
      url: `${BASE_URL}/return/${article.slug}`,
      lastModified: new Date(article.lastModified ?? article.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
