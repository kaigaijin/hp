import Link from "next/link";
import { countries } from "@/lib/countries";

const ZH_SITES = [
  { name: "LunaPos", url: "https://lunapos.jp" },
  { name: "Casinohub", url: "https://casinohub.jp" },
  { name: "Roomly", url: "https://hp.roomly.jp" },
  { name: "Wattly", url: "https://wattly.jp" },
];

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* ブランド */}
          <div>
            <p className="heading-editorial text-2xl font-bold text-white mb-1 tracking-tight">
              <span className="text-[1.2em]">K</span>aigaijin
            </p>
            <p className="text-xs italic text-stone-500 mb-4">Its country, deeply.</p>
            <p className="text-sm leading-relaxed">
              海外在住日本人のための
              <br />
              国別生活情報メディア
            </p>
          </div>

          {/* 国別リンク */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">国別ガイド</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/${c.code}`}
                  prefetch={false}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-sm">{c.flag}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 情報 */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">
              Kaigaijinについて
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/about" className="hover:text-white transition-colors">
                メディアについて
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                お問い合わせ
              </Link>
              <Link href="/advertise" className="hover:text-white transition-colors">
                広告掲載について
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
            </div>
          </div>

          {/* zhグループ */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">zh グループ</p>
            <div className="flex flex-col gap-2 text-sm">
              {ZH_SITES.map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>{site.name}</span>
                  <span className="text-[10px] text-stone-600">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800 text-center text-xs text-stone-600">
          &copy; {new Date().getFullYear()} Kaigaijin. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
