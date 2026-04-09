"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Props = {
  country: string;
  category: string;
  slug: string;
};

export default function PlaceFavoriteButton({ country, category, slug }: Props) {
  const { user, loading } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ログイン済みの場合、お気に入り状態を取得
  useEffect(() => {
    if (!user) { setIsFavorited(false); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const { favorites } = await res.json();
      setIsFavorited(
        favorites.some(
          (f: { country: string; category: string; slug: string }) =>
            f.country === country && f.category === category && f.slug === slug
        )
      );
    });
  }, [user, country, category, slug]);

  async function toggle() {
    if (!user) {
      // 未ログイン → ログインを促すだけ（UserMenuのモーダルを開く手段がないのでalert代替）
      alert("お気に入りに追加するにはログインが必要です");
      return;
    }
    setIsProcessing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsProcessing(false); return; }

    const method = isFavorited ? "DELETE" : "POST";
    const res = await fetch("/api/favorites", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ country, category, slug }),
    });

    if (res.ok) setIsFavorited(!isFavorited);
    setIsProcessing(false);
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={isProcessing}
      aria-label={isFavorited ? "お気に入りから削除" : "お気に入りに追加"}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50
        ${isFavorited
          ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
          : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
        }`}
    >
      <Heart
        size={15}
        className={isFavorited ? "fill-red-500 stroke-red-500" : "stroke-current"}
      />
      {isFavorited ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}
