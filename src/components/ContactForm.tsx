"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

const INQUIRY_TYPES = [
  { value: "advertise", label: "広告掲載について" },
  { value: "feedback", label: "記事に関するご意見・ご感想" },
  { value: "press", label: "取材・メディア掲載について" },
  { value: "other", label: "その他" },
];

export default function ContactForm() {
  const [form, setForm] = useState({
    type: "",
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ type: "", name: "", email: "", company: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-12 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
        <h3 className="heading-editorial text-2xl font-bold mb-3">
          送信しました
        </h3>
        <p className="text-stone-500 dark:text-stone-400">
          お問い合わせを受け付けました。内容を確認次第、ご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 md:p-12"
    >
      {/* 問い合わせ種別 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          お問い合わせ種別 <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-shadow"
        >
          <option value="" disabled>
            選択してください
          </option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-shadow"
            placeholder="山田 太郎"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            maxLength={254}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-shadow"
            placeholder="info@example.com"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">会社名</label>
        <input
          type="text"
          maxLength={100}
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-shadow"
          placeholder="株式会社〇〇"
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2">
          お問い合わせ内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          maxLength={5000}
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-shadow resize-y"
          placeholder="お問い合わせ内容をご入力ください。"
        />
      </div>

      {status === "error" && (
        <p className="text-red-500 text-sm mb-4">
          送信に失敗しました。時間をおいて再度お試しください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-700 to-ocean-600 text-white font-semibold px-8 py-4 rounded-full hover:from-ocean-800 hover:to-ocean-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            送信中...
          </>
        ) : (
          <>
            <Send size={18} />
            送信する
          </>
        )}
      </button>
    </form>
  );
}
