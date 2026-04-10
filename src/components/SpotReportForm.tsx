"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Pencil, Send, Loader2, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";

type ReportType = "visited" | "correction";

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
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [comment, setComment] = useState("");
  const [reportComment, setReportComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [visitedCount, setVisitedCount] = useState(0);
  const [alreadyVisited, setAlreadyVisited] = useState(false);
  const [visitComments, setVisitComments] = useState<{ comment: string; created_at: string }[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const vid = getVisitorId();
      const res = await fetch(
        `/api/place-reports?country=${country}&category=${category}&slug=${spotSlug}${vid ? `&visitor_id=${vid}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setVisitedCount(data.visited);
        setVisitComments(data.comments ?? []);
        setAlreadyVisited(data.already_visited ?? false);
      }
    } catch {}
  }, [country, category, spotSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(type: ReportType, body?: string) {
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
          report_type: type,
          comment: body?.trim() || null,
          visitor_id: getVisitorId() || null,
        }),
      });
      if (res.ok) {
        if (type === "visited") {
          setVisitedCount((c) => c + 1);
          if (body?.trim()) {
            setVisitComments((prev) => [
              { comment: body.trim(), created_at: new Date().toISOString() },
              ...prev,
            ]);
          }
          setAlreadyVisited(true);
          setComment("");
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 3000);
        } else {
          setComment("");
          setReportType(null);
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 3000);
        }
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

  const visibleComments = showAllComments ? visitComments : visitComments.slice(0, 3);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
      {/* 行ったセクション */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ThumbsUp size={16} className="text-stone-400 dark:text-stone-500" />
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">
              行った
            </span>
            {visitedCount > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium">
                {visitedCount}人
              </span>
            )}
          </div>
        </div>

        {alreadyVisited ? (
          /* 送信済み */
          <p className="flex items-center gap-2 px-4 py-2.5 text-stone-400 dark:text-stone-500 text-sm rounded-lg border border-stone-200 dark:border-stone-700">
            <CheckCircle size={14} />
            送信済み
          </p>
        ) : (
          /* コメント入力 + 送信 */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit("visited", comment);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ひとことメモ（任意）"
              maxLength={200}
              disabled={submitting}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-stone-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-700 dark:bg-stone-600 text-white text-sm font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 active:scale-95"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
              行った
            </button>
          </form>
        )}

        {/* 送信完了メッセージ */}
        {submitted && !reportType && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
            <CheckCircle size={12} />
            送信しました!
          </p>
        )}

        {/* 訪問者コメント一覧 */}
        {visitComments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {visibleComments.map((vc, i) => (
              <div key={i} className="flex gap-2 items-baseline text-sm">
                <span className="text-green-500 shrink-0">·</span>
                <span className="text-stone-600 dark:text-stone-300">{vc.comment}</span>
                <span className="text-xs text-stone-400 shrink-0">
                  {new Date(vc.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
            {visitComments.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllComments(!showAllComments)}
                className="flex items-center gap-1 text-xs text-warm-600 dark:text-warm-400 hover:underline mt-1"
              >
                {showAllComments ? (
                  <>
                    <ChevronUp size={12} />
                    閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} />
                    他{visitComments.length - 3}件を見る
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 修正・閉店の報告 */}
      <div className="px-5 pb-4 pt-2 border-t border-stone-100 dark:border-stone-700">
        {!reportType ? (
          <button
            type="button"
            onClick={() => setReportType("correction")}
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-warm-500 transition-colors"
          >
            <Pencil size={12} />
            情報の修正・報告
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit("correction", reportComment);
            }}
            className="space-y-2"
          >
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
            {submitted && reportType && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle size={12} />
                送信しました!
              </p>
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
                onClick={() => { setReportType(null); setReportComment(""); setError(""); }}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                やめる
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
