import { ImageResponse } from "next/og";
import { getCountry } from "@/lib/countries";
import { getCategory, getSpot } from "@/lib/directory";

export const alt = "KAIスポット | Kaigaijin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// オンデマンド生成（ビルド時間短縮のためgenerateStaticParamsを使わない）
export const dynamic = "force-static";
export const dynamicParams = true;

export default async function OgImage({
  params,
}: {
  params: Promise<{ country: string; category: string; slug: string }>;
}) {
  const { country: code, category: catSlug, slug } = await params;
  const country = getCountry(code);
  const category = getCategory(catSlug);
  const spot = getSpot(code, catSlug, slug);
  const displayName = spot?.name_ja ?? spot?.name ?? "スポット";
  const area = spot?.area ?? "";
  const countryName = country?.name ?? "";
  const categoryName = category?.name ?? "";

  let fontData: ArrayBuffer | null = null;
  try {
    fontData = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap"
    )
      .then((res) => res.text())
      .then((css) => {
        const match = css.match(/src: url\(([^)]+)\)/);
        if (!match) throw new Error("Font URL not found");
        return fetch(match[1]);
      })
      .then((res) => res.arrayBuffer());
  } catch {
    fontData = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a2332 0%, #2d4a3e 50%, #1a3a4a 100%)",
          padding: "60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(72,187,120,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* カテゴリ・エリア */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: '"Noto Sans JP"',
            }}
          >
            {countryName} / {categoryName}
          </div>
        </div>
        {/* スポット名 */}
        <div
          style={{
            display: "flex",
            fontSize: displayName.length > 20 ? "44px" : "56px",
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: '"Noto Sans JP"',
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "1000px",
          }}
        >
          {displayName}
        </div>
        {/* エリア */}
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "rgba(255,255,255,0.6)",
            fontFamily: '"Noto Sans JP"',
            marginTop: "16px",
          }}
        >
          {area ? `📍 ${area}` : ""}
        </div>
        {/* ブランド */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#48bb78",
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "rgba(255,255,255,0.6)",
              fontFamily: '"Noto Sans JP"',
            }}
          >
            Kaigaijin
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData && {
        fonts: [
          {
            name: "Noto Sans JP",
            data: fontData,
            style: "normal" as const,
            weight: 700,
          },
        ],
      }),
    }
  );
}
