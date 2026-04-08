"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import visaData from "@/../content/data/db/visa_simulator.json";

type EmploymentType = "employee" | "freelance" | "business_owner" | "retired" | "any";

type VisaEntry = {
  id: string;
  country_code: string;
  visa_name: string;
  category: string;
  description: string;
  conditions: {
    min_age: number | null;
    max_age: number | null;
    min_annual_income_jpy: number | null;
    min_assets_jpy: number | null;
    employment_types: string[];
    requires_employer_in_country: boolean;
    working_holiday: boolean;
    investment_required: boolean;
    company_setup_required: boolean;
    notes: string;
  };
  max_stay_years: number | null;
  renewable: boolean;
  affiliate_potential: string;
};

const visas = visaData as VisaEntry[];

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

type FormData = {
  age: string;
  annual_income_man: string;
  assets_man: string;
  employment: EmploymentType | "";
  target_countries: string[];
};

type MatchResult = {
  visa: VisaEntry;
  status: "ok" | "maybe" | "ng";
  reasons: string[];
};

function formatMan(jpy: number): string {
  if (jpy >= 100000000) {
    return `${(jpy / 100000000).toFixed(jpy % 100000000 === 0 ? 0 : 1)}億円`;
  }
  return `${Math.round(jpy / 10000)}万円`;
}

function matchVisa(visa: VisaEntry, form: FormData): MatchResult {
  const reasons: string[] = [];
  let ng = false;
  let maybe = false;

  const age = form.age ? parseInt(form.age) : null;
  const income = form.annual_income_man ? parseInt(form.annual_income_man) * 10000 : null;
  const assets = form.assets_man ? parseInt(form.assets_man) * 10000 : null;
  const employment = form.employment;

  const c = visa.conditions;

  // 年齢チェック
  if (c.min_age !== null) {
    if (age === null) {
      maybe = true;
      reasons.push(`年齢${c.min_age}歳以上が必要（未入力）`);
    } else if (age < c.min_age) {
      ng = true;
      reasons.push(`年齢${c.min_age}歳以上が必要（現在${age}歳）`);
    }
  }
  if (c.max_age !== null) {
    if (age === null) {
      maybe = true;
      reasons.push(`年齢${c.max_age}歳以下が必要（未入力）`);
    } else if (age > c.max_age) {
      ng = true;
      reasons.push(`年齢${c.max_age}歳以下が必要（現在${age}歳）`);
    }
  }

  // 年収チェック
  if (c.min_annual_income_jpy !== null) {
    if (income === null) {
      maybe = true;
      reasons.push(`年収${formatMan(c.min_annual_income_jpy)}以上が必要（未入力）`);
    } else if (income < c.min_annual_income_jpy) {
      ng = true;
      reasons.push(`年収${formatMan(c.min_annual_income_jpy)}以上が必要（現在${formatMan(income)}）`);
    }
  }

  // 資産チェック
  if (c.min_assets_jpy !== null) {
    if (assets === null) {
      maybe = true;
      reasons.push(`資産${formatMan(c.min_assets_jpy)}以上が必要（未入力）`);
    } else if (assets < c.min_assets_jpy) {
      ng = true;
      reasons.push(`資産${formatMan(c.min_assets_jpy)}以上が必要（現在${formatMan(assets)}）`);
    }
  }

  // 雇用形態チェック
  if (employment && c.employment_types.length > 0 && !c.employment_types.includes("any")) {
    if (!c.employment_types.includes(employment)) {
      ng = true;
      const required = c.employment_types.map((e) => EMPLOYMENT_LABELS[e] ?? e).join("・");
      reasons.push(`対象は${required}のみ`);
    }
  } else if (!employment && c.employment_types.length > 0 && !c.employment_types.includes("any")) {
    maybe = true;
    const required = c.employment_types.map((e) => EMPLOYMENT_LABELS[e] ?? e).join("・");
    reasons.push(`対象は${required}のみ（未入力）`);
  }

  // 会社設立・投資要件の表示
  if (c.company_setup_required) {
    reasons.push("現地法人の設立が必要");
  }
  if (c.investment_required) {
    reasons.push("現地への投資が必要");
  }

  const status = ng ? "ng" : maybe ? "maybe" : "ok";
  return { visa, status, reasons };
}

const ALL_COUNTRY_CODES = Object.keys(COUNTRY_NAMES);

export default function VisaSimulator() {
  const [form, setForm] = useState<FormData>({
    age: "",
    annual_income_man: "",
    assets_man: "",
    employment: "",
    target_countries: ALL_COUNTRY_CODES,
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results: MatchResult[] = submitted
    ? visas
        .filter((v) => form.target_countries.includes(v.country_code))
        .map((v) => matchVisa(v, form))
        .sort((a, b) => {
          const order = { ok: 0, maybe: 1, ng: 2 };
          return order[a.status] - order[b.status];
        })
    : [];

  const okCount = results.filter((r) => r.status === "ok").length;
  const maybeCount = results.filter((r) => r.status === "maybe").length;

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
    setSubmitted(true);
    setExpandedId(null);
    // 結果セクションへスクロール
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div>
      {/* ===== 入力フォーム ===== */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 mb-10">
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
          診断する
        </button>
      </form>

      {/* ===== 結果 ===== */}
      {submitted && (
        <div id="results">
          {/* サマリー */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <h2 className="heading-editorial text-2xl font-bold text-stone-800 dark:text-stone-100">
              診断結果
            </h2>
            <div className="flex gap-3 text-sm">
              {okCount > 0 && (
                <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-medium">
                  <CheckCircle size={14} />
                  条件クリア {okCount}件
                </span>
              )}
              {maybeCount > 0 && (
                <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full font-medium">
                  <AlertCircle size={14} />
                  要確認 {maybeCount}件
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            ※条件を満たしているかの目安です。ビザ取得を保証するものではありません。
          </p>

          <div className="space-y-3">
            {results.map((result) => {
              const country = COUNTRY_NAMES[result.visa.country_code];
              const isExpanded = expandedId === result.visa.id;

              return (
                <div
                  key={result.visa.id}
                  className={`bg-white dark:bg-stone-800 rounded-2xl border transition-all ${
                    result.status === "ok"
                      ? "border-emerald-200 dark:border-emerald-800"
                      : result.status === "maybe"
                      ? "border-amber-200 dark:border-amber-800"
                      : "border-stone-200 dark:border-stone-700 opacity-60"
                  }`}
                >
                  {/* ヘッダー行 */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : result.visa.id)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                  >
                    {/* ステータスアイコン */}
                    <div className="shrink-0">
                      {result.status === "ok" && (
                        <CheckCircle className="text-emerald-500" size={24} />
                      )}
                      {result.status === "maybe" && (
                        <AlertCircle className="text-amber-500" size={24} />
                      )}
                      {result.status === "ng" && (
                        <XCircle className="text-stone-400" size={24} />
                      )}
                    </div>

                    {/* 国・ビザ名 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{country?.flag}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">{country?.name}</span>
                        <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full">
                          {result.visa.category}
                        </span>
                        {result.visa.max_stay_years && (
                          <span className="text-xs text-teal-600 dark:text-teal-400">
                            最大{result.visa.max_stay_years}年
                            {result.visa.renewable ? "（更新可）" : ""}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-stone-800 dark:text-stone-100 text-base">
                        {result.visa.visa_name}
                      </p>
                    </div>

                    {/* 展開アイコン */}
                    <div className="shrink-0 text-stone-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* 展開エリア */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-stone-100 dark:border-stone-700 pt-4">
                      <p className="text-sm text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
                        {result.visa.description}
                      </p>

                      {/* 条件チェック一覧 */}
                      {result.reasons.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                            条件チェック
                          </p>
                          <ul className="space-y-1">
                            {result.reasons.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className={`mt-0.5 shrink-0 ${
                                  result.status === "ng" ? "text-red-400" : "text-amber-400"
                                }`}>
                                  {result.status === "ng" ? "✕" : "△"}
                                </span>
                                <span className="text-stone-600 dark:text-stone-300">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.status === "ok" && result.reasons.length === 0 && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={14} />
                          入力情報でのすべての条件をクリアしています
                        </div>
                      )}

                      {/* 詳細メモ */}
                      <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                          詳細・注意事項
                        </p>
                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                          {result.visa.conditions.notes}
                        </p>
                      </div>

                      {/* 国別ガイドリンク */}
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/${result.visa.country_code}`}
                          className="inline-flex items-center gap-1.5 text-sm bg-warm-50 dark:bg-warm-900/30 text-warm-700 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-900/50 px-4 py-2 rounded-full transition-colors font-medium"
                        >
                          {country?.flag} {country?.name}の生活ガイドを見る →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 専門家への相談 CTA */}
          <div className="mt-10 bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-8 text-white">
            <p className="text-teal-400 text-sm font-medium tracking-wider uppercase mb-3">— Next Step</p>
            <h3 className="heading-editorial text-2xl font-bold mb-3">
              申請は専門家に相談する
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              ビザ申請は書類準備・大使館手続きなど複雑な工程があります。移住コンサルタントや行政書士への相談で、スムーズに進めることができます。
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
            >
              Kaigaijinに相談する →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
