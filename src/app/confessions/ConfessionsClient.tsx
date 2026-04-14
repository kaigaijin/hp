"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { questions, type Question } from "@/lib/confessions";
import { useAuth } from "@/components/AuthProvider";
import { countries } from "@/lib/countries";

type Confession = {
  id: string;
  question_id: string;
  body: string;
  country: string | null;
  nickname: string | null;
  is_anonymous: boolean;
  likes: number;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function countryName(code: string | null) {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.name ?? code;
}

function QuestionCard({ question, confessions, onSubmitted }: {
  question: Question;
  confessions: Confession[];
  onSubmitted: () => void;
}) {
  const { user, displayName } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const qConfessions = confessions.filter((c) => c.question_id === question.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          text: text.trim(),
          country: country || null,
          nickname: user ? (displayName ?? null) : null,
          is_anonymous: !user,
        }),
      });
      if (res.ok) {
        setText("");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        onSubmitted();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: string) {
    if (liked.has(id)) return;
    setLiked((prev) => new Set([...prev, id]));
    await fetch("/api/confessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onSubmitted();
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* 質問ヘッダー */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex-1">
          <span className="inline-block text-xs font-medium text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-2 py-0.5 rounded-full mb-2">
            {question.category}
          </span>
          <p className="font-medium text-stone-800 dark:text-stone-100 leading-snug">
            {question.text}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-1">
          {qConfessions.length > 0 && (
            <span className="text-xs text-stone-400">{qConfessions.length}件</span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-stone-400" />
          ) : (
            <ChevronDown size={16} className="text-stone-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-stone-100 dark:border-stone-800 pt-5">
          {/* 回答一覧 */}
          {qConfessions.length > 0 && (
            <div className="space-y-3 mb-6">
              {qConfessions.map((c) => (
                <div
                  key={c.id}
                  className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4"
                >
                  <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap mb-3">
                    {c.body}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>{c.is_anonymous ? "匿名" : (c.nickname ?? "匿名")}</span>
                      {c.country && (
                        <>
                          <span>·</span>
                          <span>{countryName(c.country)}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                    <button
                      onClick={() => handleLike(c.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        liked.has(c.id)
                          ? "text-rose-500"
                          : "text-stone-400 hover:text-rose-400"
                      }`}
                    >
                      <Heart size={12} fill={liked.has(c.id) ? "currentColor" : "none"} />
                      {c.likes + (liked.has(c.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 投稿フォーム */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="あなたの体験を書いてください（匿名で投稿されます）"
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 resize-y"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500"
              >
                <option value="">在住国（任意）</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {user ? `${displayName ?? "ログイン中"}として投稿` : "匿名で投稿"}
              </button>
              {submitted && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  投稿しました
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ConfessionsClient() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("すべて");

  const categories = ["すべて", ...Array.from(new Set(questions.map((q) => q.category)))];

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/confessions");
      if (res.ok) setConfessions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredQuestions =
    activeCategory === "すべて"
      ? questions
      : questions.filter((q) => q.category === activeCategory);

  return (
    <div>
      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-warm-600 text-white"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 質問一覧 */}
      {loading ? (
        <div className="flex items-center gap-2 text-stone-400 py-12">
          <Loader2 size={18} className="animate-spin" />
          読み込み中...
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              confessions={confessions}
              onSubmitted={fetchAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
