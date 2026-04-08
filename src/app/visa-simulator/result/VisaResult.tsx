"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Share2, ArrowLeft } from "lucide-react";
import visaData from "@/../content/data/db/visa_simulator.json";
import { supabase } from "@/lib/supabase";

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
    industry_income_tiers?: { it: number; non_it: number };
  };
  application_fee_note?: string;
  max_stay_years: number | null;
  renewable: boolean;
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

const ALL_COUNTRY_CODES = Object.keys(COUNTRY_NAMES);

const EMPLOYMENT_LABELS: Record<string, string> = {
  employee: "会社員・現地採用",
  freelance: "フリーランス・業務委託",
  business_owner: "起業家・経営者",
  retired: "退職者・年金生活者",
};

function formatMan(jpy: number): string {
  if (jpy >= 100000000) {
    return `${(jpy / 100000000).toFixed(jpy % 100000000 === 0 ? 0 : 1)}億円`;
  }
  return `${Math.round(jpy / 10000)}万円`;
}

type MatchResult = {
  visa: VisaEntry;
  status: "ok" | "maybe" | "ng";
  reasons: string[];
};

function matchVisa(
  visa: VisaEntry,
  age: number | null,
  income: number | null,
  assets: number | null,
  employment: string,
  industry: string
): MatchResult {
  const reasons: string[] = [];
  let ng = false;
  let maybe = false;
  const c = visa.conditions;

  if (c.min_age !== null) {
    if (age === null) { maybe = true; reasons.push(`${c.min_age}歳以上が必要（未入力）`); }
    else if (age < c.min_age) { ng = true; reasons.push(`${c.min_age}歳以上が必要（現在${age}歳）`); }
  }
  if (c.max_age !== null) {
    if (age === null) { maybe = true; reasons.push(`${c.max_age}歳以下が必要（未入力）`); }
    else if (age > c.max_age) { ng = true; reasons.push(`${c.max_age}歳以下が必要（現在${age}歳）`); }
  }

  // 業種別年収ティアがあるビザ（DE Rantau等）
  if (c.industry_income_tiers) {
    const tiers = c.industry_income_tiers;
    if (!industry) {
      // 業種未入力: IT系の低い要件でまずチェック、ただしmaybeに
      if (income === null) {
        maybe = true;
        reasons.push(`IT系: 年収${formatMan(tiers.it)}以上 / 非IT系: 年収${formatMan(tiers.non_it)}以上が必要（業種・年収未入力）`);
      } else if (income < tiers.it) {
        ng = true;
        reasons.push(`IT系でも年収${formatMan(tiers.it)}以上が必要（現在${formatMan(income)}）`);
      } else if (income < tiers.non_it) {
        maybe = true;
        reasons.push(`IT系なら条件クリア（年収${formatMan(tiers.it)}以上）。非IT系は年収${formatMan(tiers.non_it)}以上が必要。業種を選択すると正確に判定できます`);
      }
    } else if (industry === "it") {
      if (income === null) { maybe = true; reasons.push(`年収${formatMan(tiers.it)}以上が必要（未入力）`); }
      else if (income < tiers.it) { ng = true; reasons.push(`IT系: 年収${formatMan(tiers.it)}以上が必要（現在${formatMan(income)}）`); }
    } else {
      if (income === null) { maybe = true; reasons.push(`非IT系: 年収${formatMan(tiers.non_it)}以上が必要（未入力）`); }
      else if (income < tiers.non_it) { ng = true; reasons.push(`非IT系: 年収${formatMan(tiers.non_it)}以上が必要（現在${formatMan(income)}）`); }
    }
  } else if (c.min_annual_income_jpy !== null) {
    if (income === null) { maybe = true; reasons.push(`年収${formatMan(c.min_annual_income_jpy)}以上が必要（未入力）`); }
    else if (income < c.min_annual_income_jpy) { ng = true; reasons.push(`年収${formatMan(c.min_annual_income_jpy)}以上が必要（現在${formatMan(income)}）`); }
  }

  if (c.min_assets_jpy !== null) {
    if (assets === null) { maybe = true; reasons.push(`資産${formatMan(c.min_assets_jpy)}以上が必要（未入力）`); }
    else if (assets < c.min_assets_jpy) { ng = true; reasons.push(`資産${formatMan(c.min_assets_jpy)}以上が必要（現在${formatMan(assets)}）`); }
  }
  if (employment && c.employment_types.length > 0 && !c.employment_types.includes("any")) {
    if (!c.employment_types.includes(employment)) {
      ng = true;
      reasons.push(`対象は${c.employment_types.map((e) => EMPLOYMENT_LABELS[e] ?? e).join("・")}のみ`);
    }
  } else if (!employment && c.employment_types.length > 0 && !c.employment_types.includes("any")) {
    maybe = true;
    reasons.push(`対象は${c.employment_types.map((e) => EMPLOYMENT_LABELS[e] ?? e).join("・")}のみ（未入力）`);
  }
  if (c.company_setup_required) reasons.push("現地法人の設立が必要");
  if (c.investment_required) reasons.push("現地への投資が必要");

  return { visa, status: ng ? "ng" : maybe ? "maybe" : "ok", reasons };
}

export default function VisaResult() {
  const params = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const logged = useRef(false);

  const s = params.get("s") ?? "";
  let decoded: Record<string, unknown> = {};
  try { decoded = s ? JSON.parse(atob(s)) : {}; } catch { decoded = {}; }

  const age = typeof decoded.a === "number" ? decoded.a : null;
  const incomeMan = typeof decoded.i === "number" ? decoded.i : null;
  const assetsMan = typeof decoded.as === "number" ? decoded.as : null;
  const employment = typeof decoded.e === "string" ? decoded.e : "";
  const industry = typeof decoded.in === "string" ? decoded.in : "";
  const targetCountries = typeof decoded.c === "string" ? decoded.c.split(",") : ALL_COUNTRY_CODES;

  const income = incomeMan !== null ? incomeMan * 10000 : null;
  const assets = assetsMan !== null ? assetsMan * 10000 : null;

  const INDUSTRY_LABELS: Record<string, string> = {
    it: "IT・テック系",
    non_it: "非IT系",
  };

  const results: MatchResult[] = visas
    .filter((v) => targetCountries.includes(v.country_code))
    .map((v) => matchVisa(v, age, income, assets, employment, industry))
    .sort((a, b) => ({ ok: 0, maybe: 1, ng: 2 }[a.status] - { ok: 0, maybe: 1, ng: 2 }[b.status]));

  const okCount = results.filter((r) => r.status === "ok").length;
  const maybeCount = results.filter((r) => r.status === "maybe").length;

  // ページ表示時にログ保存（1回のみ）
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    supabase.from("visa_simulator_logs").insert({
      age,
      annual_income_man: incomeMan,
      assets_man: assetsMan,
      employment: employment || null,
      industry: industry || null,
      target_countries: targetCountries,
      ok_count: okCount,
      maybe_count: maybeCount,
    }).then(({ error }) => {
      if (error) console.error("visa_simulator_logs insert error:", error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const inputSummary = [
    age !== null ? `${age}歳` : null,
    incomeMan !== null ? `年収${incomeMan}万円` : null,
    assetsMan !== null ? `資産${assetsMan}万円` : null,
    employment ? EMPLOYMENT_LABELS[employment] : null,
    industry ? INDUSTRY_LABELS[industry] : null,
  ].filter(Boolean).join("・");

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">あなたの条件での診断結果</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            条件を変更すると結果が変わります
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-warm-400 hover:text-warm-600 px-4 py-2 rounded-full transition-colors"
          >
            <Share2 size={14} />
            {copied ? "コピーしました" : "URLをコピー"}
          </button>
          <a
            href="/visa-simulator"
            className="flex items-center gap-1.5 text-sm border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-warm-400 hover:text-warm-600 px-4 py-2 rounded-full transition-colors"
          >
            <ArrowLeft size={14} />
            条件を変更
          </a>
          <a
            href="/contact"
            className="flex items-center gap-1.5 text-sm bg-warm-500 hover:bg-warm-600 text-white px-4 py-2 rounded-full transition-colors font-medium"
          >
            専門家に相談する →
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {okCount > 0 && (
          <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle size={15} /> 条件クリア {okCount}件
          </span>
        )}
        {maybeCount > 0 && (
          <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium">
            <AlertCircle size={15} /> 要確認 {maybeCount}件
          </span>
        )}
        <span className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-4 py-2 rounded-full text-sm">
          全{results.length}件
        </span>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
        ※条件を満たしているかの目安です。ビザ取得を保証するものではありません。
      </p>

      <div className="space-y-3 mb-10">
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
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : result.visa.id)}
                className="w-full flex items-center gap-4 p-5 text-left"
              >
                <div className="shrink-0">
                  {result.status === "ok" && <CheckCircle className="text-emerald-500" size={24} />}
                  {result.status === "maybe" && <AlertCircle className="text-amber-500" size={24} />}
                  {result.status === "ng" && <XCircle className="text-stone-400" size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-lg">{country?.flag}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{country?.name}</span>
                    <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full">
                      {result.visa.category}
                    </span>
                    {result.visa.max_stay_years && (
                      <span className="text-xs text-teal-600 dark:text-teal-400">
                        最大{result.visa.max_stay_years}年{result.visa.renewable ? "（更新可）" : ""}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-stone-800 dark:text-stone-100 text-base">
                    {result.visa.visa_name}
                  </p>
                </div>
                <div className="shrink-0 text-stone-400">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-stone-100 dark:border-stone-700 pt-4">
                  <p className="text-sm text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
                    {result.visa.description}
                  </p>
                  {result.reasons.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">条件チェック</p>
                      <ul className="space-y-1">
                        {result.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className={`mt-0.5 shrink-0 ${result.status === "ng" ? "text-red-400" : "text-amber-400"}`}>
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
                      <CheckCircle size={14} /> 入力情報でのすべての条件をクリアしています
                    </div>
                  )}
                  <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">詳細・注意事項</p>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      {result.visa.conditions.notes}
                    </p>
                  </div>
                  {result.visa.application_fee_note && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">申請料</p>
                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        {result.visa.application_fee_note}
                      </p>
                    </div>
                  )}
                  <a
                    href={`/${result.visa.country_code}`}
                    className="inline-flex items-center gap-1.5 text-sm bg-warm-50 dark:bg-warm-900/30 text-warm-700 dark:text-warm-400 hover:bg-warm-100 px-4 py-2 rounded-full transition-colors font-medium"
                  >
                    {country?.flag} {country?.name}の生活ガイドを見る →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-8 text-white">
        <p className="text-teal-400 text-sm font-medium tracking-wider uppercase mb-3">— Next Step</p>
        <h3 className="heading-editorial text-2xl font-bold mb-3">申請は専門家に相談する</h3>
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
  );
}
