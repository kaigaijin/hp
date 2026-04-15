"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, Heart, PenLine, X, Globe, ArrowLeft, MessageSquare } from "lucide-react";
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
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 30) return `${days}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function countryName(code: string | null) {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.name ?? code;
}

function countryFlag(code: string | null) {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.flag ?? null;
}

// ===== 質問一覧ビュー =====
function QuestionList({
  confessions,
  onSelect,
  activeCategory,
  setActiveCategory,
}: {
  confessions: Confession[];
  onSelect: (q: Question) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}) {
  const categories = ["すべて", ...Array.from(new Set(questions.map((q) => q.category)))];
  const filtered =
    activeCategory === "すべて"
      ? questions
      : questions.filter((q) => q.category === activeCategory);

  return (
    <div>
      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-1.5 mb-6">
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

      {/* 質問カード一覧 */}
      <div className="space-y-3">
        {filtered.map((q) => {
          const count = confessions.filter((c) => c.question_id === q.id).length;
          // 最新の投稿を1件プレビュー
          const latest = confessions
            .filter((c) => c.question_id === q.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          return (
            <button
              key={q.id}
              onClick={() => onSelect(q)}
              className="w-full text-left bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-5 py-4 hover:border-warm-300 dark:hover:border-warm-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[11px] font-medium text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-2 py-0.5 rounded-full mb-2">
                    {q.category}
                  </span>
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-100 leading-snug group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors">
                    {q.text}
                  </p>
                  {latest && (
                    <p className="mt-2 text-xs text-stone-400 leading-relaxed line-clamp-2">
                      {latest.body}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-stone-400">
                    <MessageSquare size={11} />
                    {count}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== 投稿カード =====
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
  const isLong = confession.body.length > 150;
  const displayBody = isLong && !expanded ? confession.body.slice(0, 150) + "…" : confession.body;
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

// ===== 投稿フォーム =====
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300">あなたの体験を書く</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X size={16} />
        </button>
      </div>
      {submitted ? (
        <p className="text-sm text-green-600 dark:text-green-400 py-2">投稿しました</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="匿名で投稿されます。体験をそのまま書いてください。"
            maxLength={1000}
            rows={4}
            autoFocus
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

// ===== 質問詳細ビュー =====
function QuestionDetail({
  question,
  confessions,
  onBack,
  onSubmitted,
}: {
  question: Question;
  confessions: Confession[];
  onBack: () => void;
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
    <div>
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        質問一覧に戻る
      </button>

      {/* 質問ヘッダー */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-6 py-5 mb-6">
        <span className="inline-block text-xs font-medium text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-2 py-0.5 rounded-full mb-3">
          {question.category}
        </span>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 leading-snug mb-4">
          {question.text}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors"
          >
            <PenLine size={14} />
            あなたの体験を書く
          </button>
        )}
      </div>

      {/* 投稿フォーム */}
      {showForm && (
        <div className="mb-6">
          <PostForm question={question} onSubmitted={onSubmitted} onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* コントロールバー */}
      {confessions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap mb-4">
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
              className={`px-3 py-1.5 border-l border-stone-200 dark:border-stone-700 transition-colors ${
                sortBy === "likes"
                  ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
                  : "text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              いいね順
            </button>
          </div>

          {presentCountries.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Globe size={12} className="text-stone-400" />
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
          )}
        </div>
      )}

      {/* 投稿一覧 */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">まだ投稿がありません。最初の一人になりませんか？</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <ConfessionCard key={c.id} confession={c} liked={liked.has(c.id)} onLike={handleLike} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== メイン =====
export default function ConfessionsClient() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("すべて");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-stone-400 py-16 justify-center">
        <Loader2 size={18} className="animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (selectedQuestion) {
    return (
      <QuestionDetail
        question={selectedQuestion}
        confessions={confessions.filter((c) => c.question_id === selectedQuestion.id)}
        onBack={() => setSelectedQuestion(null)}
        onSubmitted={fetchAll}
      />
    );
  }

  return (
    <QuestionList
      confessions={confessions}
      onSelect={setSelectedQuestion}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  );
}
