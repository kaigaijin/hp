"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getCategory } from "@/lib/directory";
import { getCountry } from "@/lib/countries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Favorite = {
  id: string;
  country: string;
  category: string;
  slug: string;
  created_at: string;
};

export default function MyFavoritesPage() {
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setFetching(false); return; }
      const res = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { favorites } = await res.json();
        setFavorites(favorites);
      }
      setFetching(false);
    });
  }, [user]);

  return (
    <>
      <Header />
      <main className="bg-sand-50 dark:bg-stone-950 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Heart size={22} className="text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
              お気に入り
            </h1>
          </div>

          {/* 未ログイン */}
          {!loading && !user && (
            <div className="text-center py-16">
              <LogIn size={36} className="mx-auto mb-4 text-stone-300" />
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                お気に入りを見るにはログインが必要です
              </p>
              <p className="text-sm text-stone-400">
                ヘッダー右上の「ログイン」からアクセスできます
              </p>
            </div>
          )}

          {/* 読み込み中 */}
          {(loading || fetching) && (
            <div className="text-center py-16 text-stone-400">読み込み中...</div>
          )}

          {/* ログイン済み・0件 */}
          {!loading && !fetching && user && favorites.length === 0 && (
            <div className="text-center py-16">
              <Heart size={36} className="mx-auto mb-4 text-stone-200 dark:text-stone-700" />
              <p className="text-stone-500 dark:text-stone-400 mb-2">
                まだお気に入りがありません
              </p>
              <p className="text-sm text-stone-400 mb-6">
                プレイスページのハートボタンで追加できます
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-warm-600 hover:text-warm-700 font-medium"
              >
                プレイスを探す
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* お気に入り一覧 */}
          {!loading && !fetching && favorites.length > 0 && (
            <ul className="space-y-3">
              {favorites.map((fav) => {
                const country = getCountry(fav.country);
                const category = getCategory(fav.category);
                const href = `/${fav.country}/place/${fav.category}/${fav.slug}`;
                // slugから表示名を生成（ハイフン→スペース・先頭大文字）
                const slugName = fav.slug
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");

                return (
                  <li key={fav.id}>
                    <Link
                      href={href}
                      className="flex items-center gap-4 bg-white dark:bg-stone-900 rounded-xl px-5 py-4 border border-stone-100 dark:border-stone-800 hover:border-warm-300 dark:hover:border-warm-700 transition-colors group"
                    >
                      <Heart size={16} className="text-red-400 fill-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 dark:text-stone-50 truncate group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors">
                          {slugName}
                        </p>
                        <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {country?.flag} {country?.name}
                          {category && (
                            <span className="ml-1">· {category.name}</span>
                          )}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-stone-300 group-hover:text-warm-400 transition-colors shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
