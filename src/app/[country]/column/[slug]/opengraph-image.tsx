import { ImageResponse } from "next/og";
import { getArticle, getArticlesByCountry } from "@/lib/articles";
import { countries } from "@/lib/countries";

export const alt = "Kaigaijin 記事";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return countries.flatMap((c) =>
    getArticlesByCountry(c.code).map((a) => ({
      country: c.code,
      slug: a.slug,
    }))
  );
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country: code, slug } = await params;
  const article = getArticle(code, slug);
  const title = article?.meta.title ?? "Kaigaijin";

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
        <div
          style={{
            fontSize: title.length > 30 ? "42px" : "52px",
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: '"Noto Sans JP"',
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>
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
