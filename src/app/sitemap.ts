import { MetadataRoute } from "next";
import { countries } from "@/lib/countries";
import { getAllArticles } from "@/lib/articles";
import { categories, getAllSpots } from "@/lib/directory";

const BASE_URL = "https://kaigaijin.jp";

export default function sitemap(): MetadataRoute.Sitemap {
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

  // 国ページ
  for (const country of countries) {
    entries.push({
      url: `${BASE_URL}/${country.code}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // スポット カテゴリ一覧
    const spots = getAllSpots(country.code);
    if (spots.length > 0) {
      entries.push({
        url: `${BASE_URL}/${country.code}/spot`,
        changeFrequency: "weekly",
        priority: 0.7,
      });

      // スポット カテゴリ別一覧（3件以上のカテゴリのみ）
      for (const cat of categories) {
        const catSpots = spots.filter((s) => s.category === cat.slug);
        if (catSpots.length >= 3) {
          entries.push({
            url: `${BASE_URL}/${country.code}/spot/${cat.slug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }

      // スポット 個別ページ
      for (const spot of spots) {
        entries.push({
          url: `${BASE_URL}/${country.code}/spot/${spot.category}/${spot.slug}`,
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
      url: `${BASE_URL}/${article.country}/${article.slug}`,
      lastModified: new Date(article.lastModified ?? article.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
