"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Loader2, Heart, ChevronDown, ChevronUp, PenLine, X, Globe } from "lucide-react";
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
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 30) return `${days}日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function countryName(code: string | null) {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.name ?? code;
}

function countryFlag(code: string | null) {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.flag ?? null;
}

// 投稿カード
function ConfessionCard({
  confession,
  liked,
  onLike,
}: {
  confession: Confession;
  liked: boolean;
  onLike: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = confession.body.length > 120;
  const displayBody = isLong && !expanded ? confession.body.slice(0, 120) + "…" : confession.body;
  const flag = countryFlag(confession.country);
  const cName = countryName(confession.country);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-5 py-4 space-y-3">
      <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
        {displayBody}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-warm-600 dark:text-warm-400 hover:underline"
        >
          {expanded ? "折りたたむ" : "続きを読む"}
        </button>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {flag && cName && (
            <span className="flex items-center gap-1">
              {flag} {cName}
            </span>
          )}
          {flag && cName && <span>·</span>}
          <span>{confession.is_anonymous ? "匿名" : (confession.nickname ?? "匿名")}</span>
          <span>·</span>
          <span>{formatDate(confession.created_at)}</span>
        </div>
        <button
          onClick={() => onLike(confession.id)}
          className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-full ${
            liked
              ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
              : "text-stone-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          }`}
        >
          <Heart size={12} fill={liked ? "currentColor" : "none"} />
          {confession.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  );
}

// 投稿フォーム
function PostForm({
  question,
  onSubmitted,
  onClose,
}: {
  question: Question;
  onSubmitted: () => void;
  onClose: () => void;
}) {
  const { user, displayName } = useAuth();
  const [text, setText] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
        setSubmitted(true);
        onSubmitted();
        setTimeout(onClose, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-warm-50 dark:bg-stone-800 rounded-2xl border border-warm-200 dark:border-stone-700 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-200 leading-snug flex-1 pr-4">
          {question.text}
        </p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 shrink-0">
          <X size={16} />
        </button>
      </div>
      {submitted ? (
        <p className="text-sm text-green-600 dark:text-green-400 py-2">投稿しました</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="あなたの体験を書いてください（匿名で投稿されます）"
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 resize-y"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500"
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
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {user ? `${displayName ?? "ログイン中"}として投稿` : "匿名で投稿"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// 質問パネル（投稿一覧 + 書くボタン）
function QuestionPanel({
  question,
  confessions,
  onSubmitted,
}: {
  question: Question;
  confessions: Confession[];
  onSubmitted: () => void;
}) {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "likes">("new");
  const [filterCountry, setFilterCountry] = useState<string>("");

  const presentCountries = Array.from(
    new Set(confessions.map((c) => c.country).filter(Boolean))
  ) as string[];

  const sorted = [...confessions]
    .filter((c) => !filterCountry || c.country === filterCountry)
    .sort((a, b) =>
      sortBy === "likes"
        ? b.likes - a.likes
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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
    <div className="space-y-4">
      {/* コントロールバー */}
      {confessions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* ソート */}
          <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden text-xs">
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
              onClick={() => setSortBy("likes")}
              className={`px-3 py-1.5 transition-colors border-l border-stone-200 dark:border-stone-700 ${
                sortBy === "likes"
                  ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
                  : "text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              いいね順
            </button>
          </div>

          {/* 国フィルター */}
          {presentCountries.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Globe size={12} className="text-stone-400" />
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setFilterCountry("")}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    !filterCountry
                      ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  全て
                </button>
                {presentCountries.map((code) => {
                  const c = countries.find((c) => c.code === code);
                  return (
                    <button
                      key={code}
                      onClick={() => setFilterCountry(code === filterCountry ? "" : code)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        filterCountry === code
                          ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
                      }`}
                    >
                      {c?.flag} {c?.name ?? code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 投稿一覧 */}
      {sorted.length === 0 ? (
        <p className="text-sm text-stone-400 py-4 text-center">まだ投稿がありません。最初の一人になりませんか？</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <ConfessionCard
              key={c.id}
              confession={c}
              liked={liked.has(c.id)}
              onLike={handleLike}
            />
          ))}
        </div>
      )}

      {/* 投稿フォーム or 書くボタン */}
      {showForm ? (
        <PostForm question={question} onSubmitted={onSubmitted} onClose={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-600 text-sm text-stone-400 hover:border-warm-400 hover:text-warm-600 dark:hover:border-warm-500 dark:hover:text-warm-400 transition-colors"
        >
          <PenLine size={14} />
          あなたの体験を書く
        </button>
      )}
    </div>
  );
}

export default function ConfessionsClient() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("すべて");
  const [activeQuestion, setActiveQuestion] = useState<Question>(questions[0]);

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

  // activeQuestionがフィルター外になったらリセット
  useEffect(() => {
    if (!filteredQuestions.find((q) => q.id === activeQuestion.id)) {
      setActiveQuestion(filteredQuestions[0]);
    }
  }, [activeCategory, filteredQuestions, activeQuestion.id]);

  const activeConfessions = confessions.filter((c) => c.question_id === activeQuestion.id);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* 左: 質問リスト */}
      <div className="md:w-80 shrink-0">
        {/* カテゴリフィルター */}
        <div className="flex flex-wrap gap-1.5 mb-4">
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

        {/* 質問一覧 */}
        <div className="space-y-1">
          {filteredQuestions.map((q) => {
            const count = confessions.filter((c) => c.question_id === q.id).length;
            const isActive = activeQuestion.id === q.id;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestion(q)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                }`}
              >
                <p className="text-sm leading-snug">{q.text}</p>
                {count > 0 && (
                  <p className={`text-xs mt-1 ${isActive ? "text-stone-400 dark:text-stone-600" : "text-stone-400"}`}>
                    {count}件の回答
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 右: 選択中の質問の投稿一覧 */}
      <div className="flex-1 min-w-0">
        {/* 質問ヘッダー */}
        <div className="mb-5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <span className="inline-block text-xs font-medium text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-2 py-0.5 rounded-full mb-2">
            {activeQuestion.category}
          </span>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 leading-snug">
            {activeQuestion.text}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-stone-400 py-12">
            <Loader2 size={18} className="animate-spin" />
            読み込み中...
          </div>
        ) : (
          <QuestionPanel
            question={activeQuestion}
            confessions={activeConfessions}
            onSubmitted={fetchAll}
          />
        )}
      </div>
    </div>
  );
}
