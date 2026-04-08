"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EmploymentType = "employee" | "freelance" | "business_owner" | "retired";
type IndustryType = "it" | "non_it";

const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  sg: { name: "シンガポール", flag: "🇸🇬" },
  th: { name: "タイ", flag: "🇹🇭" },
  my: { name: "マレーシア", flag: "🇲🇾" },
  ae: { name: "UAE", flag: "🇦🇪" },
  au: { name: "オーストラリア", flag: "🇦🇺" },
  kr: { name: "韓国", flag: "🇰🇷" },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  employee: "会社員・現地採用",
  freelance: "フリーランス・業務委託",
  business_owner: "起業家・経営者",
  retired: "退職者・年金生活者",
};

const ALL_COUNTRY_CODES = Object.keys(COUNTRY_NAMES);

const INDUSTRY_LABELS: Record<string, string> = {
  it: "IT・テック・エンジニア・デザイナー",
  non_it: "非IT（営業・管理・士業・クリエイター等）",
};

type FormData = {
  age: string;
  annual_income_man: string;
  assets_man: string;
  employment: EmploymentType | "";
  industry: IndustryType | "";
  target_countries: string[];
};

export default function VisaSimulator() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    age: "",
    annual_income_man: "",
    assets_man: "",
    employment: "",
    industry: "",
    target_countries: ALL_COUNTRY_CODES,
  });

  function toggleCountry(code: string) {
    setForm((prev) => ({
      ...prev,
      target_countries: prev.target_countries.includes(code)
        ? prev.target_countries.filter((c) => c !== code)
        : [...prev.target_countries, code],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    if (form.age) payload.a = parseInt(form.age);
    if (form.annual_income_man) payload.i = parseInt(form.annual_income_man);
    if (form.assets_man) payload.as = parseInt(form.assets_man);
    if (form.employment) payload.e = form.employment;
    if (form.industry) payload.in = form.industry;
    if (form.target_countries.length < ALL_COUNTRY_CODES.length) {
      payload.c = form.target_countries.join(",");
    }
    const s = btoa(JSON.stringify(payload));
    router.push(`/visa-simulator/result?s=${s}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8">
      <h2 className="heading-editorial text-2xl font-bold mb-8 text-stone-800 dark:text-stone-100">
        あなたの情報を入力
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 年齢 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
            年齢
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={18}
              max={99}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="例: 35"
              className="w-full border border-stone-300 dark:border-stone-600 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-warm-400 text-base"
            />
            <span className="text-stone-500 dark:text-stone-400 text-sm whitespace-nowrap">歳</span>
          </div>
        </div>

        {/* 年収 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
            年収（税引前・概算）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={form.annual_income_man}
              onChange={(e) => setForm({ ...form, annual_income_man: e.target.value })}
              placeholder="例: 800"
              className="w-full border border-stone-300 dark:border-stone-600 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-warm-400 text-base"
            />
            <span className="text-stone-500 dark:text-stone-400 text-sm whitespace-nowrap">万円</span>
          </div>
        </div>

        {/* 資産 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
            流動資産（預金・投資・現金）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={form.assets_man}
              onChange={(e) => setForm({ ...form, assets_man: e.target.value })}
              placeholder="例: 2000"
              className="w-full border border-stone-300 dark:border-stone-600 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-warm-400 text-base"
            />
            <span className="text-stone-500 dark:text-stone-400 text-sm whitespace-nowrap">万円</span>
          </div>
        </div>

        {/* 雇用形態 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
            職業・雇用形態
          </label>
          <select
            value={form.employment}
            onChange={(e) => setForm({ ...form, employment: e.target.value as EmploymentType | "" })}
            className="w-full border border-stone-300 dark:border-stone-600 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-warm-400 text-base"
          >
            <option value="">選択してください</option>
            {Object.entries(EMPLOYMENT_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* 業種 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
            業種・職種
            <span className="ml-2 text-xs font-normal text-stone-400">（一部ビザで年収要件が変わります）</span>
          </label>
          <select
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value as IndustryType | "" })}
            className="w-full border border-stone-300 dark:border-stone-600 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-warm-400 text-base"
          >
            <option value="">選択してください（任意）</option>
            {Object.entries(INDUSTRY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 対象国 */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
          調べたい国（複数選択可）
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_COUNTRY_CODES.map((code) => {
            const c = COUNTRY_NAMES[code];
            const selected = form.target_countries.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleCountry(code)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  selected
                    ? "bg-warm-500 border-warm-500 text-white"
                    : "bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-warm-400"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={form.target_countries.length === 0}
        className="w-full bg-warm-500 hover:bg-warm-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors"
      >
        診断する →
      </button>
    </form>
  );
}
