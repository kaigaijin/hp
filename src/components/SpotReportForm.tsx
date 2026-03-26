"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Pencil, Send, Loader2, ThumbsUp } from "lucide-react";

type ReportType = "visited" | "closed" | "correction";

export default function SpotReportForm({
  country,
  category,
  spotSlug,
  spotName,
}: {
  country: string;
  category: string;
  spotSlug: string;
  spotName: string;
}) {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(type: ReportType, body?: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/spot-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          category,
          spot_slug: spotSlug,
          spot_name: spotName,
          report_type: type,
          comment: body?.trim() || null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setComment("");
        setSelected(null);
      } else {
        const data = await res.json();
        setError(data.error || "送信に失敗しました");
      }
    } catch {
      setError("送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 text-center">
        <CheckCircle size={24} className="text-green-600 dark:text-green-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
          ありがとうございます!
        </p>
        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
          確認後、スポット情報に反映されます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
      {/* ヘッダー: 質問形式で行動を促す */}
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
          この情報は正確ですか?
        </p>
        <p className="text-xs text-stone-400 mt-0.5">
          実際に行った方の情報が、他の日本人の助けになります
        </p>
      </div>

      {/* 3つのアクションボタン: 常に表示 */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (selected === "visited") {
              setSelected(null);
            } else {
              setSelected(null);
              handleSubmit("visited");
            }
          }}
          disabled={submitting}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
            submitting
              ? "opacity-50 cursor-not-allowed border-stone-200 dark:border-stone-600 text-stone-400"
              : "border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-300 active:scale-95"
          }`}
        >
          <ThumbsUp size={14} />
          行ってきた
        </button>

        <button
          type="button"
          onClick={() => setSelected(selected === "closed" ? null : "closed")}
          disabled={submitting}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
            selected === "closed"
              ? "border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
              : submitting
              ? "opacity-50 cursor-not-allowed border-stone-200 dark:border-stone-600 text-stone-400"
              : "border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
          }`}
        >
          <XCircle size={14} />
          閉店していた
        </button>

        <button
          type="button"
          onClick={() => setSelected(selected === "correction" ? null : "correction")}
          disabled={submitting}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
            selected === "correction"
              ? "border-ocean-400 dark:border-ocean-600 text-ocean-700 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30"
              : submitting
              ? "opacity-50 cursor-not-allowed border-stone-200 dark:border-stone-600 text-stone-400"
              : "border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-ocean-300 hover:text-ocean-600 dark:hover:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-900/20 active:scale-95"
          }`}
        >
          <Pencil size={14} />
          情報を修正
        </button>
      </div>

      {/* 展開エリア: 閉店・修正を選んだときだけコメント欄を表示 */}
      {selected && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(selected, comment);
          }}
          className="px-5 pb-5 pt-2 border-t border-stone-100 dark:border-stone-700 space-y-3"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              selected === "closed"
                ? "閉店の状況を教えてください（移転先がわかれば記載）"
                : "修正内容を記載してください（住所・電話番号・営業時間など）"
            }
            maxLength={1000}
            rows={2}
            required={selected === "correction"}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-y placeholder:text-stone-400"
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || (selected === "correction" && !comment.trim())}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ocean-600 text-white text-sm font-medium rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              送信
            </button>
            <button
              type="button"
              onClick={() => { setSelected(null); setComment(""); setError(""); }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              やめる
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
