import { ImageResponse } from "next/og";
import { getCountry } from "@/lib/countries";
import { getCategory, getCategoryGroup } from "@/lib/directory";

export const alt = "KAIスポット | Kaigaijin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// オンデマンド生成（ビルド時間短縮）
export const dynamic = "force-static";
export const dynamicParams = true;

export default async function OgImage({
  params,
}: {
  params: Promise<{ country: string; category: string }>;
}) {
  const { country: code, category: catSlug } = await params;
  const country = getCountry(code);
  const countryName = country?.name ?? "";
  const flag = country?.flag ?? "🌏";

  // グループまたはカテゴリの名前を取得
  const group = getCategoryGroup(catSlug);
  const category = getCategory(catSlug);
  const categoryName = group?.name ?? category?.name ?? "スポット";

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

  const title = `${countryName}の${categoryName}`;

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
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,178,172,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* 国旗+カテゴリ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", fontSize: "48px" }}>{flag}</div>
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: '"Noto Sans JP"',
            }}
          >
            {countryName} / KAIスポット
          </div>
        </div>
        {/* タイトル */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 15 ? "44px" : "52px",
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: '"Noto Sans JP"',
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>
        {/* サブタイトル */}
        <div
          style={{
            display: "flex",
            fontSize: "22px",
            color: "rgba(255,255,255,0.6)",
            fontFamily: '"Noto Sans JP"',
            marginTop: "16px",
            textAlign: "center",
          }}
        >
          日本人向けスポットを探す
        </div>
        {/* ブランド */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "40px",
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
