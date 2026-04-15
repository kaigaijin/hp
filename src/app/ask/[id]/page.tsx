"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, Heart, ArrowLeft, BadgeCheck, Globe, PenLine, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { countries } from "@/lib/countries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Question = {
  id: string;
  body: string;
  category: string;
  is_official: boolean;
  nickname: string | null;
  is_anonymous: boolean;
  answer_count: number;
  created_at: string;
};

type Answer = {
  id: string;
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

function AnswerCard({ answer, liked, onLike }: { answer: Answer; liked: boolean; onLike: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = answer.body.length > 150;
  const displayBody = isLong && !expanded ? answer.body.slice(0, 150) + "…" : answer.body;
  const flag = countryFlag(answer.country);
  const cName = countryName(answer.country);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-5 py-4 space-y-3">
      <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">{displayBody}</p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="text-xs text-warm-600 dark:text-warm-400 hover:underline">
          {expanded ? "折りたたむ" : "続きを読む"}
        </button>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {flag && cName && <span className="flex items-center gap-1">{flag} {cName}</span>}
          {flag && cName && <span>·</span>}
          <span>{answer.is_anonymous ? "匿名" : (answer.nickname ?? "匿名")}</span>
          <span>·</span>
          <span>{formatDate(answer.created_at)}</span>
        </div>
        <button
          onClick={() => onLike(answer.id)}
          className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-full ${
            liked ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20" : "text-stone-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          }`}
        >
          <Heart size={12} fill={liked ? "currentColor" : "none"} />
          {answer.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  );
}

function AnswerForm({ questionId, onSubmitted, onClose }: { questionId: string; onSubmitted: () => void; onClose: () => void }) {
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
      const res = await fetch("/api/ask/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
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
    <div className="bg-warm-50 dark:bg-stone-800 rounded-2xl border border-warm-200 dark:border-stone-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">回答を書く</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
      </div>
      {submitted ? (
        <p className="text-sm text-green-600 dark:text-green-400 py-2">回答しました</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="あなたの体験や考えを書いてください（匿名で投稿されます）"
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
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {user ? `${displayName ?? "ログイン中"}として回答` : "匿名で回答"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "likes">("new");
  const [filterCountry, setFilterCountry] = useState("");

  const fetchData = useCallback(async () => {
    const [qRes, aRes] = await Promise.all([
      fetch("/api/ask"),
      fetch(`/api/ask/answers?question_id=${params.id}`),
    ]);
    if (qRes.ok) {
      const qs: Question[] = await qRes.json();
      setQuestion(qs.find((q) => q.id === params.id) ?? null);
    }
    if (aRes.ok) setAnswers(await aRes.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLike(id: string) {
    if (liked.has(id)) return;
    setLiked((prev) => new Set([...prev, id]));
    await fetch("/api/ask/answers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  const presentCountries = Array.from(new Set(answers.map((a) => a.country).filter(Boolean))) as string[];

  const sorted = [...answers]
    .filter((a) => !filterCountry || a.country === filterCountry)
    .sort((a, b) =>
      sortBy === "likes"
        ? b.likes - a.likes
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <button
            onClick={() => router.push("/ask")}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            質問一覧に戻る
          </button>

          {loading ? (
            <div className="flex items-center gap-2 text-stone-400 py-16 justify-center">
              <Loader2 size={18} className="animate-spin" />
              読み込み中...
            </div>
          ) : !question ? (
            <p className="text-stone-400 text-center py-16">質問が見つかりませんでした。</p>
          ) : (
            <>
              {/* 質問ヘッダー */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-6 py-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block text-xs font-medium text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-2 py-0.5 rounded-full">
                    {question.category}
                  </span>
                  {question.is_official && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      <BadgeCheck size={11} />
                      運営からの質問
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 leading-snug mb-4">
                  {question.body}
                </h1>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-400">
                    {!question.is_official && (
                      <span className="mr-2">{question.is_anonymous ? "匿名" : (question.nickname ?? "匿名")} ·</span>
                    )}
                    {formatDate(question.created_at)} · {question.answer_count}件の回答
                  </p>
                  {!showForm && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors"
                    >
                      <PenLine size={13} />
                      回答する
                    </button>
                  )}
                </div>
              </div>

              {/* 回答フォーム */}
              {showForm && (
                <AnswerForm questionId={question.id} onSubmitted={fetchData} onClose={() => setShowForm(false)} />
              )}

              {/* ソート・フィルター */}
              {answers.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden text-xs">
                    <button
                      onClick={() => setSortBy("new")}
                      className={`px-3 py-1.5 transition-colors ${sortBy === "new" ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900" : "text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"}`}
                    >
                      新着順
                    </button>
                    <button
                      onClick={() => setSortBy("likes")}
                      className={`px-3 py-1.5 border-l border-stone-200 dark:border-stone-700 transition-colors ${sortBy === "likes" ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900" : "text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800"}`}
                    >
                      いいね順
                    </button>
                  </div>
                  {presentCountries.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Globe size={12} className="text-stone-400" />
                      <button
                        onClick={() => setFilterCountry("")}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${!filterCountry ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900" : "bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200"}`}
                      >
                        全て
                      </button>
                      {presentCountries.map((code) => {
                        const c = countries.find((c) => c.code === code);
                        return (
                          <button
                            key={code}
                            onClick={() => setFilterCountry(code === filterCountry ? "" : code)}
                            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${filterCountry === code ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900" : "bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200"}`}
                          >
                            {c?.flag} {c?.name ?? code}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 回答一覧 */}
              {sorted.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <p className="text-sm mb-4">まだ回答がありません。最初の一人になりませんか？</p>
                  {!showForm && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors"
                    >
                      <PenLine size={14} />
                      回答する
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sorted.map((a) => (
                    <AnswerCard key={a.id} answer={a} liked={liked.has(a.id)} onLike={handleLike} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
