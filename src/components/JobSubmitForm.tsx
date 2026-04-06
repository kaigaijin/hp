"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send, ChevronDown } from "lucide-react";

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

type FormData = {
  company: string;
  company_website: string;
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
  description: string;
  requirements: string;
  benefits: string;
  contact_email: string;
  contact_url: string;
  applicant_email: string;
};

const INITIAL_FORM: FormData = {
  company: "",
  company_website: "",
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
  contact_url: "",
  applicant_email: "",
};

// 通貨の選択肢（国別）
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

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{children}</p>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-stone-400 disabled:opacity-50 disabled:cursor-not-allowed";

const selectClass =
  "w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:opacity-50 disabled:cursor-not-allowed";

const textareaClass =
  "w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-stone-400 resize-y disabled:opacity-50 disabled:cursor-not-allowed";

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
      />
    </div>
  );
}

export default function JobSubmitForm({ country }: { country: string }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // フィールドエラーをクリア
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.company.trim()) errors.company = "企業名を入力してください";
    if (!form.title.trim()) errors.title = "求人タイトルを入力してください";
    if (!form.industry) errors.industry = "業種を選択してください";
    if (!form.job_type.trim()) errors.job_type = "職種を入力してください";
    if (!form.employment_type) errors.employment_type = "雇用形態を選択してください";
    if (!form.location.trim()) errors.location = "勤務地を入力してください";
    if (!form.description.trim()) errors.description = "求人詳細を入力してください";
    if (!form.contact_email.trim() && !form.contact_url.trim()) {
      errors.contact_email = "応募先メールまたは応募URLのどちらかを入力してください";
      errors.contact_url = "応募先メールまたは応募URLのどちらかを入力してください";
    }
    if (!form.applicant_email.trim()) {
      errors.applicant_email = "担当者メールアドレスを入力してください";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

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
      } else {
        setError(data.error || "送信に失敗しました。しばらく経ってからお試しください");
      }
    } catch {
      setError("送信に失敗しました。しばらく経ってからお試しください");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          求人情報を受け付けました
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          ご投稿ありがとうございます。内容を確認のうえ、順次掲載いたします。
          <br />
          掲載可否は担当者メールアドレスにご連絡します（通常2〜3営業日）。
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          別の求人を投稿する
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-8">

        {/* ─── 企業情報 ─── */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-5 pb-3 border-b border-stone-100 dark:border-stone-700">
            企業情報
          </h2>
          <div className="space-y-4">
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
              {fieldErrors.company && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.company}</p>
              )}
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
            </div>
          </div>
        </section>

        {/* ─── 求人詳細 ─── */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-5 pb-3 border-b border-stone-100 dark:border-stone-700">
            求人詳細
          </h2>
          <div className="space-y-4">
            <div>
              <Label required>求人タイトル</Label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例: フルタイムスタッフ募集"
                maxLength={200}
                disabled={submitting}
                className={inputClass}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {fieldErrors.industry && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.industry}</p>
                )}
              </div>

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
                {fieldErrors.job_type && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.job_type}</p>
                )}
              </div>
            </div>

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
              {fieldErrors.employment_type && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.employment_type}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {fieldErrors.location && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p>
                )}
              </div>
              <div>
                <Label>最寄り駅（任意）</Label>
                <input
                  type="text"
                  name="nearest_station"
                  value={form.nearest_station}
                  onChange={handleChange}
                  placeholder="例: Orchard MRT駅"
                  maxLength={100}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 給与 ─── */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-1 pb-3 border-b border-stone-100 dark:border-stone-700">
            給与（任意）
          </h2>
          <FieldNote>未入力の場合は「要相談」として表示されます</FieldNote>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>最低</Label>
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
                <Label>最高</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
        </section>

        {/* ─── 求人内容 ─── */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-5 pb-3 border-b border-stone-100 dark:border-stone-700">
            求人内容
          </h2>
          <div className="space-y-4">
            <div>
              <Label>語学要件（任意）</Label>
              <input
                type="text"
                name="language_requirement"
                value={form.language_requirement}
                onChange={handleChange}
                placeholder="例: 日本語のみ可 / 英語N3レベル以上"
                maxLength={200}
                disabled={submitting}
                className={inputClass}
              />
            </div>
            <div>
              <Label required>求人詳細</Label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="仕事内容、勤務時間、職場環境など詳しく記載してください"
                rows={6}
                maxLength={10000}
                disabled={submitting}
                className={textareaClass}
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
              )}
            </div>
            <div>
              <Label>応募要件（任意）</Label>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                placeholder="必要なスキル、経験、資格など"
                rows={3}
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
                placeholder="社会保険、交通費支給、昇給、ビザサポートなど"
                rows={3}
                maxLength={5000}
                disabled={submitting}
                className={textareaClass}
              />
            </div>
          </div>
        </section>

        {/* ─── 応募方法 ─── */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-1 pb-3 border-b border-stone-100 dark:border-stone-700">
            応募方法
          </h2>
          <FieldNote>メールとURLのどちらか一方は必ず入力してください</FieldNote>
          <div className="mt-4 space-y-4">
            <div>
              <Label>応募先メールアドレス</Label>
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
              {fieldErrors.contact_email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.contact_email}</p>
              )}
            </div>
            <div>
              <Label>応募URL</Label>
              <input
                type="url"
                name="contact_url"
                value={form.contact_url}
                onChange={handleChange}
                placeholder="https://example.com/careers/apply"
                maxLength={500}
                disabled={submitting}
                className={inputClass}
              />
              {fieldErrors.contact_url && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.contact_url}</p>
              )}
            </div>
          </div>
        </section>

        {/* ─── 担当者情報 ─── */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-1 pb-3 border-b border-stone-100 dark:border-stone-700">
            担当者情報
          </h2>
          <FieldNote>掲載確認のご連絡に使用します。求職者には公開されません。</FieldNote>
          <div className="mt-4">
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
            {fieldErrors.applicant_email && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.applicant_email}</p>
            )}
          </div>
        </section>

        {/* ─── 送信エリア ─── */}
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            投稿内容を確認後、通常2〜3営業日で掲載いたします。掲載に関するご不明点はお問い合わせください。
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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

      </div>
    </form>
  );
}
