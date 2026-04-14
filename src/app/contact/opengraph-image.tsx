import { ImageResponse } from "next/og";

export const alt = "お問い合わせ | Kaigaijin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
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
            fontSize: "52px",
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: '"Noto Sans JP"',
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          お問い合わせ
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.6)",
            fontFamily: '"Noto Sans JP"',
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          広告掲載・取材依頼・ご意見はこちらから
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
        fonts: [{ name: "Noto Sans JP", data: fontData, style: "normal", weight: 700 }],
      }),
    }
  );
}
