import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/my-favorites",
        "/my-reviews",
        "/reset-password",
        "/review",
      ],
    },
    sitemap: "https://kaigaijin.jp/sitemap.xml",
  };
}
