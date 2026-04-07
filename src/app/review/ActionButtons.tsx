"use client";

import { useState } from "react";
import { Trash2, CheckCircle, Loader2 } from "lucide-react";

type Props = {
  country: string;
  category: string;
  slug: string;
  onDone: (action: "delete" | "keep") => void;
};

export function ActionButtons({ country, category, slug, onDone }: Props) {
  const [loading, setLoading] = useState<"delete" | "keep" | null>(null);
  const [done, setDone] = useState<"delete" | "keep" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "delete" | "keep") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, category, slug, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
      } else {
        setDone(action);
        onDone(action);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  if (done === "delete") {
    return (
      <span className="text-xs text-red-500 font-medium flex items-center gap-1">
        <Trash2 size={12} /> 削除済み
      </span>
    );
  }
  if (done === "keep") {
    return (
      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
        <CheckCircle size={12} /> 掲載確定
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={() => handleAction("keep")}
        disabled={loading !== null}
        className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === "keep" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <CheckCircle size={12} />
        )}
        掲載する
      </button>
      <button
        onClick={() => handleAction("delete")}
        disabled={loading !== null}
        className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === "delete" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
        削除する
      </button>
    </div>
  );
}
