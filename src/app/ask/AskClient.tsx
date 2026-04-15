"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare, PenLine, X, ChevronRight, BadgeCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  body: string;
  category: string;
  is_official: boolean;
  nickname: string | null;
  is_anonymous: boolean;
  answer_count: number;
  likes: number;
  created_at: string;
};

const CATEGORIES = ["人間関係", "パートナー・家族", "本音", "制度・お金", "仕事", "その他"];

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 30) return `${days}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

// 質問投稿フォーム
function QuestionForm({ onSubmitted, onClose }: { onSubmitted: () => void; onClose: () => void }) {
  const { user, displayName } = useAuth();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("その他");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          category,
          nickname: user ? (displayName ?? null) : null,
          is_anonymous: !user,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onSubmitted();
        setTimeout(onClose, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-warm-50 dark:bg-stone-800 rounded-2xl border border-warm-200 dark:border-stone-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">質問を投稿する</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X size={16} />
        </button>
      </div>
      {submitted ? (
        <p className="text-sm text-green-600 dark:text-green-400 py-2">投稿しました！回答が集まるのをお待ちください。</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="海外在住日本人に聞いてみたいことを書いてください（200文字以内）"
            maxLength={200}
            rows={3}
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">{text.length}/200</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              匿名で投稿
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// 質問カード
function QuestionCard({ question, onClick }: { question: Question; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-5 py-4 hover:border-warm-300 dark:hover:border-warm-700 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-[11px] font-medium text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-2 py-0.5 rounded-full">
              {question.category}
            </span>
            {question.is_official && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} />
                運営
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-stone-800 dark:text-stone-100 leading-snug group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors">
            {question.body}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
            {!question.is_official && (
              <span>{question.is_anonymous ? "匿名" : (question.nickname ?? "匿名")}</span>
            )}
            <span>{formatDate(question.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <MessageSquare size={12} />
            {question.answer_count}
          </div>
          <ChevronRight size={14} className="text-stone-300 group-hover:text-warm-500 transition-colors" />
        </div>
      </div>
    </button>
  );
}

// メイン
export default function AskClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "popular">("new");

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/ask");
      if (res.ok) setQuestions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const categories = ["すべて", ...CATEGORIES];

  const filtered = questions
    .filter((q) => activeCategory === "すべて" || q.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === "popular") return b.answer_count - a.answer_count;
      // 新着順: 運営質問を上に固定しつつ、その中でも新しい順
      if (a.is_official !== b.is_official) return a.is_official ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-stone-400 py-16 justify-center">
        <Loader2 size={18} className="animate-spin" />
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      {/* 質問投稿ボタン */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 mb-6 rounded-2xl border-2 border-dashed border-warm-300 dark:border-warm-700 text-sm font-medium text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-900/20 transition-colors"
        >
          <PenLine size={15} />
          質問を投稿する
        </button>
      )}

      {showForm && (
        <QuestionForm onSubmitted={fetchQuestions} onClose={() => setShowForm(false)} />
      )}

      {/* フィルター・ソート */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-warm-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden text-xs w-fit">
          <button
            onClick={() => setSortBy("new")}
            className={`px-3 py-1.5 transition-colors ${
              sortBy === "new"
                ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
                : "text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            新着順
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-3 py-1.5 border-l border-stone-200 dark:border-stone-700 transition-colors ${
              sortBy === "popular"
                ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
                : "text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            回答が多い順
          </button>
        </div>
      </div>

      {/* 質問一覧 */}
      <div className="space-y-3">
        {filtered.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onClick={() => router.push(`/ask/${q.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
