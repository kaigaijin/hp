"use client";

import { useState } from "react";
import { CheckCircle, Pencil, Send, Loader2 } from "lucide-react";

// ブラウザ固有の訪問者IDを生成・永続化
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  const key = "kaigaijin_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

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
  const [showForm, setShowForm] = useState(false);
  const [reportComment, setReportComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/place-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          category,
          spot_slug: spotSlug,
          spot_name: spotName,
          report_type: "correction",
          comment: reportComment.trim() || null,
          visitor_id: getVisitorId() || null,
        }),
      });
      if (res.ok) {
        setReportComment("");
        setShowForm(false);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
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

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-5 py-4">
      {submitted ? (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle size={12} />
          送信しました。ありがとうございます。
        </p>
      ) : !showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-warm-500 transition-colors"
        >
          <Pencil size={12} />
          情報の修正・報告
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            情報の修正・報告
          </p>
          <textarea
            value={reportComment}
            onChange={(e) => setReportComment(e.target.value)}
            placeholder="修正内容・閉店情報などを教えてください（住所・電話番号・営業時間・閉店など）"
            maxLength={1000}
            rows={2}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 resize-y placeholder:text-stone-400"
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || !reportComment.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-600 text-white text-xs font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              送信
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setReportComment(""); setError(""); }}
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
