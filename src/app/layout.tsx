import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaigaijin | 海外在住日本人のための国別生活ガイド",
  description:
    "シンガポール、タイ、UAE、ベトナム…国別に深い生活情報を届ける、海外在住日本人のためのメディア。ビザ・保険・住居・税金・医療、現地で本当に必要な情報を。",
  openGraph: {
    title: "Kaigaijin | 海外在住日本人のための国別生活ガイド",
    description:
      "国別に深い生活情報を届ける、海外在住日本人のためのメディア。",
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 transition-colors">
        {children}
      </body>
    </html>
  );
}
