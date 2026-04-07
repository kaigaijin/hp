"use client";

import { useState } from "react";
import {
  CheckCircle,
  Loader2,
  Send,
  ChevronDown,
  Building2,
  BriefcaseBusiness,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  DollarSign,
  Languages,
  Globe,
  ChevronUp,
} from "lucide-react";

// クライアントコンポーネントのため、jobs.ts（fs依存）からはインポートせず直接定義
const JOB_INDUSTRIES = [
  { slug: "restaurant", label: "飲食・レストラン" },
  { slug: "retail", label: "小売・販売" },
  { slug: "it", label: "IT・エンジニア" },
  { slug: "education", label: "教育・講師" },
  { slug: "hospitality", label: "ホテル・観光" },
  { slug: "beauty", label: "美容・エステ" },
  { slug: "medical", label: "医療・介護" },
  { slug: "finance", label: "金融・会計" },
  { slug: "office", label: "オフィス・事務" },
  { slug: "other", label: "その他" },
] as const;

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  fulltime: "正社員",
  parttime: "パートタイム",
  contract: "契約社員",
  freelance: "フリーランス",
};

const SALARY_TYPE_LABELS: Record<string, string> = {
  monthly: "月給",
  hourly: "時給",
  annual: "年収",
};

const CURRENCY_OPTIONS = [
  { value: "SGD", label: "SGD（シンガポールドル）" },
  { value: "THB", label: "THB（タイバーツ）" },
  { value: "MYR", label: "MYR（マレーシアリンギット）" },
  { value: "KRW", label: "KRW（韓国ウォン）" },
  { value: "TWD", label: "TWD（台湾ドル）" },
  { value: "HKD", label: "HKD（香港ドル）" },
  { value: "AUD", label: "AUD（オーストラリアドル）" },
  { value: "AED", label: "AED（UAEディルハム）" },
  { value: "VND", label: "VND（ベトナムドン）" },
  { value: "USD", label: "USD（米ドル）" },
  { value: "JPY", label: "JPY（日本円）" },
  { value: "EUR", label: "EUR（ユーロ）" },
  { value: "GBP", label: "GBP（英ポンド）" },
];

type FormData = {
  // Step 1: 企業情報
  company: string;
  company_website: string;
  applicant_email: string;
  // Step 2: 求人詳細
  title: string;
  industry: string;
  job_type: string;
  employment_type: string;
  location: string;
  nearest_station: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_type: string;
  language_requirement: string;
  // Step 3: 求人内容・応募方法
  description: string;
  requirements: string;
  benefits: string;
  contact_email: string;
};

const INITIAL_FORM: FormData = {
  company: "",
  company_website: "",
  applicant_email: "",
  title: "",
  industry: "",
  job_type: "",
  employment_type: "",
  location: "",
  nearest_station: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "",
  salary_type: "",
  language_requirement: "",
  description: "",
  requirements: "",
  benefits: "",
  contact_email: "",
};

// ステップ定義
const STEPS = [
  {
    id: 1,
    label: "企業情報",
    icon: Building2,
    description: "会社名・担当者メール",
  },
  {
    id: 2,
    label: "求人詳細",
    icon: BriefcaseBusiness,
    description: "職種・給与・勤務地",
  },
  {
    id: 3,
    label: "内容・応募方法",
    icon: FileText,
    description: "仕事内容・応募先",
  },
] as const;

// ─── スタイル定数 ─────────────────────────────
const inputClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition";

const selectClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition";

const textareaClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-stone-500 resize-y disabled:opacity-50 disabled:cursor-not-allowed transition";

// ─── 小コンポーネント ─────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">{children}</p>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={14}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
      />
    </div>
  );
}

// ─── ステップインジケーター ────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? "bg-indigo-600 text-white"
                    : active
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500"
                }`}
              >
                {done ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <Icon size={18} />
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold hidden sm:block ${
                    active
                      ? "text-indigo-700 dark:text-indigo-400"
                      : done
                        ? "text-stone-500 dark:text-stone-400"
                        : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-[10px] hidden sm:block ${
                    active ? "text-stone-500" : "text-stone-400"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[-18px] sm:mt-[-30px] transition-colors ${
                  current > step.id
                    ? "bg-indigo-600"
                    : "bg-stone-200 dark:bg-stone-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── プレビューコンポーネント ─────────────────
function JobPreview({ form, collapsed, onToggle }: { form: FormData; collapsed?: boolean; onToggle?: () => void }) {
  const industryLabel =
    JOB_INDUSTRIES.find((i) => i.slug === form.industry)?.label ?? "";
  const employmentLabel = EMPLOYMENT_TYPE_LABELS[form.employment_type] ?? "";

  let salaryText = "要相談";
  if (form.salary_min || form.salary_max) {
    const currency = form.salary_currency || "";
    const typeLabel = SALARY_TYPE_LABELS[form.salary_type] ?? "";
    if (form.salary_min && form.salary_max) {
      salaryText = `${currency} ${Number(form.salary_min).toLocaleString()}〜${Number(form.salary_max).toLocaleString()} / ${typeLabel}`;
    } else if (form.salary_min) {
      salaryText = `${currency} ${Number(form.salary_min).toLocaleString()}〜 / ${typeLabel}`;
    } else if (form.salary_max) {
      salaryText = `〜${currency} ${Number(form.salary_max).toLocaleString()} / ${typeLabel}`;
    }
  }

  const isEmpty = !form.title && !form.company && !form.description;

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-stone-900 overflow-hidden">
      {/* ヘッダー */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition lg:cursor-default lg:pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-indigo-500 dark:text-indigo-400" />
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
            リアルタイムプレビュー
          </span>
        </div>
        {onToggle && (
          <span className="lg:hidden">
            {collapsed
              ? <ChevronDown size={15} className="text-indigo-400" />
              : <ChevronUp size={15} className="text-indigo-400" />
            }
          </span>
        )}
      </button>

      {/* プレビュー本体 */}
      {!collapsed && (
        <div className="p-5">
          {isEmpty ? (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-6">
              入力すると、ここにプレビューが表示されます
            </p>
          ) : (
            <div className="space-y-3">
              {/* バッジ */}
              {employmentLabel && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  {employmentLabel}
                </span>
              )}

              {/* タイトル */}
              <h3 className={`text-base font-bold leading-snug ${form.title ? "text-stone-800 dark:text-stone-100" : "text-stone-300 dark:text-stone-600"}`}>
                {form.title || "（求人タイトル）"}
              </h3>

              {/* 企業名 + 業種 */}
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className={form.company ? "" : "text-stone-300 dark:text-stone-600"}>
                  {form.company || "（企業名）"}
                </span>
                {industryLabel && (
                  <span className="text-stone-300 dark:text-stone-600 ml-1.5">/ {industryLabel}</span>
                )}
              </p>

              {/* 説明文 */}
              {form.description ? (
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-4 whitespace-pre-line">
                  {form.description}
                </p>
              ) : (
                <p className="text-xs text-stone-300 dark:text-stone-600">（仕事内容）</p>
              )}

              {/* メタ情報 */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
                {form.location && (
                  <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <MapPin size={11} className="shrink-0 text-stone-400" />
                    {form.location}
                    {form.nearest_station && (
                      <span className="text-stone-400">（{form.nearest_station}）</span>
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <DollarSign size={11} className="shrink-0 text-indigo-400" />
                  {salaryText}
                </span>
                {form.language_requirement && (
                  <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <Languages size={11} className="shrink-0 text-stone-400" />
                    {form.language_requirement}
                  </span>
                )}
                {form.company_website && (
                  <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <Globe size={11} className="shrink-0 text-stone-400" />
                    <span className="truncate">{form.company_website}</span>
                  </span>
                )}
              </div>

              {/* 要件・福利厚生 */}
              {(form.requirements || form.benefits) && (
                <div className="space-y-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                  {form.requirements && (
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">応募要件</p>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2 whitespace-pre-line">{form.requirements}</p>
                    </div>
                  )}
                  {form.benefits && (
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">待遇・福利厚生</p>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2 whitespace-pre-line">{form.benefits}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 応募先 */}
              {form.contact_email && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg">
                    応募する
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────
export default function JobSubmitForm({ country }: { country: string }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [previewCollapsed, setPreviewCollapsed] = useState(true); // モバイル用折りたたみ

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateStep(s: number): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.company.trim()) errors.company = "企業名を入力してください";
      if (!form.applicant_email.trim())
        errors.applicant_email = "担当者メールアドレスを入力してください";
    }
    if (s === 2) {
      if (!form.title.trim()) errors.title = "求人タイトルを入力してください";
      if (!form.industry) errors.industry = "業種を選択してください";
      if (!form.job_type.trim()) errors.job_type = "職種を入力してください";
      if (!form.employment_type) errors.employment_type = "雇用形態を選択してください";
      if (!form.location.trim()) errors.location = "勤務地を入力してください";
    }
    if (s === 3) {
      if (!form.description.trim()) errors.description = "求人詳細を入力してください";
      if (!form.contact_email.trim()) errors.contact_email = "応募先メールアドレスを入力してください";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, country }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setForm(INITIAL_FORM);
        setStep(1);
      } else {
        setError(data.error || "送信に失敗しました。しばらく経ってからお試しください");
      }
    } catch {
      setError("送信に失敗しました。しばらく経ってからお試しください");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── 完了画面 ──────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-10 text-center">
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle size={36} className="text-green-500 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3">
          受け付けました
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
          ご投稿ありがとうございます。内容を確認後、通常 2〜3 営業日以内に掲載可否をご連絡します。
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
        >
          別の求人を投稿する
        </button>
      </div>
    );
  }

  // ─── フォーム本体 ─────────────────────────
  return (
    <div>
      <StepIndicator current={step} />

      {/* 2カラムレイアウト: 左=フォーム、右=プレビュー（デスクトップ） */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

      {/* モバイル: プレビューをフォーム上部に折りたたみ表示 */}
      <div className="lg:hidden mb-4">
        <JobPreview
          form={form}
          collapsed={previewCollapsed}
          onToggle={() => setPreviewCollapsed((v) => !v)}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="min-w-0">
        {/* ═══ Step 1: 企業情報 ═══════════════════════ */}
        {step === 1 && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">
                企業情報を入力してください
              </h2>
              <p className="text-sm text-stone-400">
                担当者メールアドレスは求職者には公開されません。
              </p>
            </div>

            <div>
              <Label required>企業名</Label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="例: 株式会社カイガイジン"
                maxLength={100}
                disabled={submitting}
                className={inputClass}
              />
              <FieldError msg={fieldErrors.company} />
            </div>

            <div>
              <Label>企業サイトURL（任意）</Label>
              <input
                type="url"
                name="company_website"
                value={form.company_website}
                onChange={handleChange}
                placeholder="https://example.com"
                maxLength={500}
                disabled={submitting}
                className={inputClass}
              />
              <FieldNote>公式サイトがある場合は入力してください。求人ページに掲載されます。</FieldNote>
            </div>

            <div>
              <Label required>担当者メールアドレス</Label>
              <input
                type="email"
                name="applicant_email"
                value={form.applicant_email}
                onChange={handleChange}
                placeholder="contact@example.com"
                maxLength={254}
                disabled={submitting}
                className={inputClass}
              />
              <FieldNote>掲載確認・修正依頼のご連絡に使用します。求職者には表示されません。</FieldNote>
              <FieldError msg={fieldErrors.applicant_email} />
            </div>
          </div>
        )}

        {/* ═══ Step 2: 求人詳細 ═══════════════════════ */}
        {step === 2 && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">
                求人の詳細情報
              </h2>
              <p className="text-sm text-stone-400">
                職種・勤務地・給与など求職者が確認する基本情報を入力してください。
              </p>
            </div>

            {/* 求人タイトル */}
            <div>
              <Label required>求人タイトル</Label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例: ホールスタッフ募集（日本語対応・シフト制）"
                maxLength={200}
                disabled={submitting}
                className={inputClass}
              />
              <FieldNote>一覧ページに表示される求人タイトル。具体的で検索されやすい表現にしましょう。</FieldNote>
              <FieldError msg={fieldErrors.title} />
            </div>

            {/* 業種 */}
            <div>
              <Label required>業種</Label>
              <SelectWrapper>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  disabled={submitting}
                  className={selectClass}
                >
                  <option value="">選択してください</option>
                  {JOB_INDUSTRIES.map((ind) => (
                    <option key={ind.slug} value={ind.slug}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
              <FieldError msg={fieldErrors.industry} />
            </div>

            {/* 職種 */}
            <div>
              <Label required>職種</Label>
              <input
                type="text"
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
                placeholder="例: ホールスタッフ"
                maxLength={100}
                disabled={submitting}
                className={inputClass}
              />
              <FieldError msg={fieldErrors.job_type} />
            </div>

            {/* 雇用形態 */}
            <div>
              <Label required>雇用形態</Label>
              <SelectWrapper>
                <select
                  name="employment_type"
                  value={form.employment_type}
                  onChange={handleChange}
                  disabled={submitting}
                  className={selectClass}
                >
                  <option value="">選択してください</option>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
              <FieldError msg={fieldErrors.employment_type} />
            </div>

            {/* 勤務地 */}
            <div>
              <Label required>勤務地</Label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="例: シンガポール・オーチャード"
                maxLength={200}
                disabled={submitting}
                className={inputClass}
              />
              <FieldError msg={fieldErrors.location} />
            </div>

            {/* 最寄り駅 */}
            <div>
              <Label>最寄り駅・バス停（任意）</Label>
              <input
                type="text"
                name="nearest_station"
                value={form.nearest_station}
                onChange={handleChange}
                placeholder="例: Orchard MRT駅 徒歩3分"
                maxLength={100}
                disabled={submitting}
                className={inputClass}
              />
            </div>

            {/* 給与 */}
            <div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1.5">
                給与（任意）
              </p>
              <FieldNote>未入力の場合は「要相談」として表示されます。</FieldNote>
              <div className="mt-3 space-y-4">
                <div>
                  <Label>最低給与</Label>
                  <input
                    type="number"
                    name="salary_min"
                    value={form.salary_min}
                    onChange={handleChange}
                    placeholder="例: 3000"
                    min={0}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label>最高給与</Label>
                  <input
                    type="number"
                    name="salary_max"
                    value={form.salary_max}
                    onChange={handleChange}
                    placeholder="例: 5000"
                    min={0}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label>通貨</Label>
                  <SelectWrapper>
                    <select
                      name="salary_currency"
                      value={form.salary_currency}
                      onChange={handleChange}
                      disabled={submitting}
                      className={selectClass}
                    >
                      <option value="">選択してください</option>
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
                <div>
                  <Label>給与タイプ</Label>
                  <SelectWrapper>
                    <select
                      name="salary_type"
                      value={form.salary_type}
                      onChange={handleChange}
                      disabled={submitting}
                      className={selectClass}
                    >
                      <option value="">選択してください</option>
                      {Object.entries(SALARY_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
              </div>
            </div>

            {/* 語学要件 */}
            <div>
              <Label>語学要件（任意）</Label>
              <input
                type="text"
                name="language_requirement"
                value={form.language_requirement}
                onChange={handleChange}
                placeholder="例: 日本語のみ可 / 英語日常会話レベル以上"
                maxLength={200}
                disabled={submitting}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ═══ Step 3: 求人内容・応募方法 ════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">
                  求人内容・応募方法
                </h2>
                <p className="text-sm text-stone-400">
                  仕事内容を具体的に書くと応募率が上がります。
                </p>
              </div>

              <div>
                <Label required>仕事内容・求人詳細</Label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder={`例:\n・ランチ・ディナーのホール業務\n・オーダー受付、料理提供、テーブルセッティング\n・シフト制（週3〜OK）\n・日本語のみで働ける環境です`}
                  rows={7}
                  maxLength={10000}
                  disabled={submitting}
                  className={textareaClass}
                />
                <FieldNote>
                  改行・箇条書きを使うと読みやすくなります。勤務時間・休日・職場の雰囲気も書いてみてください。
                </FieldNote>
                <FieldError msg={fieldErrors.description} />
              </div>

              <div>
                <Label>応募要件（任意）</Label>
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder={`例:\n・飲食店経験不問\n・日本語ネイティブレベル\n・現地ビザ保持者優遇`}
                  rows={4}
                  maxLength={5000}
                  disabled={submitting}
                  className={textareaClass}
                />
              </div>

              <div>
                <Label>待遇・福利厚生（任意）</Label>
                <textarea
                  name="benefits"
                  value={form.benefits}
                  onChange={handleChange}
                  placeholder={`例:\n・社会保険完備\n・交通費支給\n・ビザサポートあり\n・昇給・賞与制度あり`}
                  rows={4}
                  maxLength={5000}
                  disabled={submitting}
                  className={textareaClass}
                />
              </div>
            </div>

            {/* 応募方法セクション */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">
                  応募先メールアドレス
                </h2>
                <p className="text-sm text-stone-400">
                  求職者からの応募を受け取るメールアドレスを入力してください。
                </p>
              </div>

              <div>
                <Label required>応募先メールアドレス</Label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={handleChange}
                  placeholder="apply@example.com"
                  maxLength={254}
                  disabled={submitting}
                  className={inputClass}
                />
                <FieldNote>求職者に公開されます。応募希望者からメールが届きます。</FieldNote>
                <FieldError msg={fieldErrors.contact_email} />
              </div>
            </div>

          </div>
        )}

        {/* ─── ナビゲーションボタン ─── */}
        <div className="mt-8 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-sm font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              戻る
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm"
            >
              次へ
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex-1 space-y-3">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
                投稿内容を確認後、通常 2〜3 営業日で掲載いたします。
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition text-sm shadow-md shadow-indigo-200 dark:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    求人情報を投稿する（無料）
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* デスクトップ: 右サイドスティッキープレビュー */}
      <div className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
        <JobPreview form={form} />
      </div>

      </div>{/* end 2カラムレイアウト */}
    </div>
  );
}
