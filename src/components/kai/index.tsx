/**
 * KAI デザインシステム プリミティブ
 * 和モダン（墨・朱・生成り / 明朝 × Noto Sans JP）
 */

import React from "react";

// ─── タイポグラフィプリミティブ ───────────────────────

interface TextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const KaiSerif = ({ children, className = "", style }: TextProps) => (
  <span
    className={className}
    style={{ fontFamily: "var(--font-serif)", ...style }}
  >
    {children}
  </span>
);

export const KaiSans = ({ children, className = "", style }: TextProps) => (
  <span
    className={className}
    style={{ fontFamily: "var(--font-sans)", ...style }}
  >
    {children}
  </span>
);

export const KaiMono = ({ children, className = "", style }: TextProps) => (
  <span
    className={className}
    style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.6875rem",
      letterSpacing: "0.06em",
      ...style,
    }}
  >
    {children}
  </span>
);

// 縦書きラベル（和の符号）
interface VerticalLabelProps {
  children: React.ReactNode;
  color?: string;
}
export const VerticalLabel = ({
  children,
  color = "var(--color-shu-500)",
}: VerticalLabelProps) => (
  <span
    aria-hidden="true"
    style={{
      writingMode: "vertical-rl",
      fontFamily: "var(--font-serif)",
      fontSize: "0.6875rem",
      letterSpacing: "0.2em",
      color,
      lineHeight: 1,
      padding: "6px 2px",
      borderTop: `1px solid ${color}`,
      borderBottom: `1px solid ${color}`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

// 英文キャプション（全角字間・小さい）
interface EnCaptionProps {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}
export const EnCaption = ({
  children,
  color = "var(--color-sumi-500)",
  style,
  className = "",
}: EnCaptionProps) => (
  <span
    className={className}
    style={{
      fontFamily: "var(--font-serif-en)",
      fontSize: "0.65625rem",
      letterSpacing: "0.24em",
      textTransform: "uppercase" as const,
      color,
      ...style,
    }}
  >
    {children}
  </span>
);

// 番号ラベル（No. 01）
interface NumberLabelProps {
  n: number;
  color?: string;
}
export const NumberLabel = ({
  n,
  color = "var(--color-shu-500)",
}: NumberLabelProps) => (
  <span
    style={{
      fontFamily: "var(--font-serif-en)",
      fontSize: "0.6875rem",
      letterSpacing: "0.08em",
      color,
      fontStyle: "italic",
      fontWeight: 500,
    }}
  >
    No.{String(n).padStart(2, "0")}
  </span>
);

// ─── ボタン ────────────────────────────────────────────

type BtnKind = "primary" | "ghost" | "sumi" | "link";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  children: React.ReactNode;
  kind?: BtnKind;
  size?: BtnSize;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export const KaiBtn = ({
  children,
  kind = "primary",
  size = "md",
  icon,
  onClick,
  href,
  style,
  type = "button",
  className = "",
}: BtnProps) => {
  const sizes: Record<BtnSize, { px: number; py: number; fs: number }> = {
    sm: { px: 14, py: 8, fs: 12.5 },
    md: { px: 22, py: 12, fs: 14 },
    lg: { px: 28, py: 16, fs: 15 },
  };
  const s = sizes[size];

  const kinds: Record<BtnKind, React.CSSProperties> = {
    primary: {
      background: "var(--color-shu-500)",
      color: "#fff",
      border: "1px solid var(--color-shu-700)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-fg)",
      border: "1px solid var(--color-border)",
    },
    sumi: {
      background: "var(--color-sumi-900)",
      color: "var(--color-kinari-50)",
      border: "1px solid var(--color-sumi-900)",
    },
    link: {
      background: "transparent",
      color: "var(--color-shu-500)",
      border: "none",
      padding: 0,
      textDecoration: "underline",
      textDecorationThickness: "1px",
      textUnderlineOffset: "4px",
    },
  };

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: kind === "link" ? undefined : `${s.py}px ${s.px}px`,
    fontFamily: "var(--font-sans)",
    fontSize: s.fs,
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
    borderRadius: kind === "link" ? 0 : "4px",
    transition: "all 0.2s ease",
    textDecoration: kind === "link" ? "underline" : "none",
    ...kinds[kind],
    ...style,
  };

  if (href) {
    return (
      <a href={href} className={className} style={baseStyle}>
        {children}
        {icon && (
          <span style={{ fontSize: s.fs + 1, lineHeight: 0 }}>{icon}</span>
        )}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={className} style={baseStyle}>
      {children}
      {icon && (
        <span style={{ fontSize: s.fs + 1, lineHeight: 0 }}>{icon}</span>
      )}
    </button>
  );
};

// ─── タグ / チップ ────────────────────────────────────

type TagTone = "neutral" | "shu" | "ai" | "moegi" | "verified";

interface TagProps {
  children: React.ReactNode;
  tone?: TagTone;
  style?: React.CSSProperties;
}

export const KaiTag = ({ children, tone = "neutral", style }: TagProps) => {
  const tones: Record<
    TagTone,
    { bg: string; fg: string; bd: string }
  > = {
    neutral: {
      bg: "var(--color-kinari-100)",
      fg: "var(--color-sumi-600)",
      bd: "var(--color-border)",
    },
    shu: {
      bg: "var(--color-shu-50)",
      fg: "var(--color-shu-700)",
      bd: "var(--color-shu-100)",
    },
    ai: {
      bg: "var(--color-ai-100)",
      fg: "var(--color-ai-700)",
      bd: "var(--color-ai-200)",
    },
    moegi: { bg: "#eef2e2", fg: "#3e5a1e", bd: "#d3dcb2" },
    verified: { bg: "#eaf1e8", fg: "#3e7a42", bd: "#c5d8c0" },
  };
  const t = tones[tone] || tones.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--font-sans)",
        fontSize: "0.71875rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        padding: "3px 9px",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        borderRadius: "2px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

// ─── 罫線 / 仕切り ────────────────────────────────────

interface RuleProps {
  color?: string;
  style?: React.CSSProperties;
}

export const Hairline = ({
  color = "var(--color-border)",
  style,
}: RuleProps) => (
  <hr
    style={{
      border: 0,
      borderTop: `1px solid ${color}`,
      margin: 0,
      ...style,
    }}
  />
);

export const DoubleRule = ({
  color = "var(--color-sumi-800)",
  style,
}: RuleProps) => (
  <div
    style={{
      borderTop: `1px solid ${color}`,
      borderBottom: `1px solid ${color}`,
      height: 4,
      ...style,
    }}
  />
);

export const DottedRule = ({
  color = "var(--color-border)",
  style,
}: RuleProps) => (
  <div
    style={{
      borderTop: `1px dashed ${color}`,
      height: 1,
      ...style,
    }}
  />
);

// ─── L字コーナーブラケット ────────────────────────────

interface BracketProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const Bracket = ({
  size = 14,
  color = "var(--color-sumi-800)",
  style,
}: BracketProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    style={style}
    aria-hidden="true"
  >
    <path
      d={`M1 1 L1 ${size - 1} M1 1 L${size - 1} 1`}
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);
