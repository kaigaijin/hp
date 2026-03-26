"use client";

import { useState } from "react";
import { Flag, CheckCircle, XCircle, Pencil, Send, Loader2 } from "lucide-react";

type ReportType = "visited" | "closed" | "correction";

const reportTypes: { value: ReportType; label: string; icon: typeof Flag; description: string }[] = [
  { value: "visited", label: "行ってきた", icon: CheckCircle, description: "実際に訪問して営業を確認" },
  { value: "closed", label: "閉店していた", icon: XCircle, description: "閉店・移転していた" },
  { value: "correction", label: "情報の修正", icon: Pencil, description: "住所・電話番号・営業時間等の修正" },
];

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
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>("visited");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          comment: comment.trim() || null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setComment("");
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
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle size={18} />
          <p className="text-sm font-medium">情報を送信しました。ありがとうございます!</p>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          確認後、スポット情報に反映されます。
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
      >
        <Flag size={14} />
        このスポットの情報を更新する
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-700">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2">
          <Flag size={14} />
          スポット情報を更新する
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* 報告タイプ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {reportTypes.map((rt) => {
            const Icon = rt.icon;
            const selected = type === rt.value;
            return (
              <button
                key={rt.value}
                type="button"
                onClick={() => setType(rt.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                  selected
                    ? "border-ocean-500 bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300"
                    : "border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-300"
                }`}
              >
                <Icon size={16} className={selected ? "text-ocean-600" : ""} />
                <div>
                  <p className="text-sm font-medium">{rt.label}</p>
                  <p className="text-xs opacity-70">{rt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* コメント */}
        <div>
          <label htmlFor="spot-report-comment" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            コメント{type === "correction" ? "（修正内容を記載）" : "（任意）"}
          </label>
          <textarea
            id="spot-report-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              type === "visited"
                ? "訪問日や気づいたことがあれば..."
                : type === "closed"
                ? "閉店の状況を教えてください（移転先がわかれば記載）..."
                : "修正内容を具体的に記載してください..."
            }
            maxLength={1000}
            rows={3}
            required={type === "correction"}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-y"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || (type === "correction" && !comment.trim())}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-600 text-white text-sm font-medium rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            送信する
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
