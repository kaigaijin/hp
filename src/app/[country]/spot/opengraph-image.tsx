import { ImageResponse } from "next/og";
import { getCountry } from "@/lib/countries";

export const alt = "KAIスポット | Kaigaijin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  const countryName = country?.name ?? "";
  const flag = country?.flag ?? "🌏";

  let fontData: ArrayBuffer;
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
    fontData = new ArrayBuffer(0);
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
        {/* 国旗 */}
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            marginBottom: "24px",
          }}
        >
          {flag}
        </div>
        {/* タイトル */}
        <div
          style={{
            display: "flex",
            fontSize: "52px",
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: '"Noto Sans JP"',
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {countryName}のKAIスポット
        </div>
        {/* サブタイトル */}
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "rgba(255,255,255,0.6)",
            fontFamily: '"Noto Sans JP"',
            marginTop: "16px",
            textAlign: "center",
          }}
        >
          日本人向けスポットをカテゴリ別に探す
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
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
