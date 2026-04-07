"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

type Props = {
  jobSlug: string;
  jobTitle: string;
  country: string;
  industry: string;
  companyName: string;
};

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-stone-500 disabled:opacity-50 transition";

export default function JobApplyForm({
  jobSlug,
  jobTitle,
  country,
  industry,
  companyName,
}: Props) {
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobSlug,
          jobTitle,
          country,
          industry,
          applicantName,
          applicantEmail,
          message,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "送信に失敗しました。もう一度お試しください。");
        return;
      }

      setDone(true);
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
        <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block" />
          この求人に応募する
        </h2>
      </div>

      <div className="px-6 py-6">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={40} className="text-green-500" />
            <p className="text-base font-bold text-stone-800 dark:text-stone-100">
              応募を送信しました
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {companyName}の担当者よりご連絡いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                お名前
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                maxLength={100}
                placeholder="山田 太郎"
                disabled={loading}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                メールアドレス
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                required
                maxLength={254}
                placeholder="taro@example.com"
                disabled={loading}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                メッセージ
                <span className="ml-1 text-stone-400 font-normal">（任意）</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="自己紹介や志望動機など"
                disabled={loading}
                className={INPUT_CLASS}
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold py-4 rounded-xl text-sm shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  送信中...
                </>
              ) : (
                "応募する"
              )}
            </button>

            <p className="text-xs text-stone-400 text-center">
              送信した情報は求人担当者にのみ転送されます。メールアドレスは公開されません。
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
