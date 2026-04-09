// GA4カスタムイベント計測ユーティリティ

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

/** プレイス詳細ページを閲覧したとき */
export function trackPlaceView(params: {
  country: string;
  category: string;
  place_slug: string;
}) {
  gtag("event", "place_view", {
    country: params.country,
    category: params.category,
    place_slug: params.place_slug,
  });
}

/** 外部リンク（公式サイト・電話）をクリックしたとき */
export function trackPlaceExternalClick(params: {
  country: string;
  category: string;
  place_slug: string;
  link_type: "website" | "phone";
}) {
  gtag("event", "place_external_click", {
    country: params.country,
    category: params.category,
    place_slug: params.place_slug,
    link_type: params.link_type,
  });
}

/** アフィリエイトリンクをクリックしたとき */
export function trackAffiliateClick(params: {
  service: string;
  country: string;
  article_slug?: string;
}) {
  gtag("event", "affiliate_click", {
    service: params.service,
    country: params.country,
    article_slug: params.article_slug ?? "",
  });
}
