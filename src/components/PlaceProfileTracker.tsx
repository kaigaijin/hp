"use client";

/**
 * プレイス閲覧をユーザープロファイルに記録するトラッカー
 *
 * Phase 2: place-profile Cookie に閲覧カテゴリ・タグ・エリアを蓄積
 * Phase 3: ログイン済みの場合は Supabase の user_place_history にも保存
 *          → サーバーサイドのランキングにフィードバックされる
 */

import { useEffect } from "react";
import { parseProfile, updateProfile, serializeProfile } from "@/lib/rank-places";
import { supabase } from "@/lib/supabase";

type Props = {
  countryCode: string;
  categorySlug: string;
  placeSlug: string;
  tags: string[];
  area: string;
};

const COOKIE_NAME = "place-profile";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

export default function PlaceProfileTracker({
  countryCode,
  categorySlug,
  placeSlug,
  tags,
  area,
}: Props) {
  useEffect(() => {
    // --- Phase 2: Cookie更新 ---
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")
      .slice(1)
      .join("=");

    const profile = parseProfile(raw);
    const next = updateProfile(profile, categorySlug, tags, area);

    document.cookie = [
      `${COOKIE_NAME}=${serializeProfile(next)}`,
      `max-age=${COOKIE_MAX_AGE}`,
      "path=/",
      "SameSite=Lax",
    ].join("; ");

    // --- Phase 3: ログイン済みなら Supabase に閲覧履歴を保存 ---
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      supabase
        .from("user_place_history")
        .upsert(
          {
            user_id: session.user.id,
            country_code: countryCode,
            category_slug: categorySlug,
            place_slug: placeSlug,
            tags,
            area,
            visited_at: new Date().toISOString(),
          },
          {
            // 同一ユーザー×同一プレイスは visited_at を更新するだけ
            onConflict: "user_id,country_code,category_slug,place_slug",
          },
        )
        .then(({ error }) => {
          if (error) console.warn("[PlaceProfileTracker] Supabase error:", error.message);
        });
    });
  }, [countryCode, categorySlug, placeSlug, tags, area]);

  return null;
}
