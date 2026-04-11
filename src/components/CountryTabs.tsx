"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MapPin, BriefcaseBusiness } from "lucide-react";

type Props = {
  countryCode: string;
  articleCount: number;
  placeCount: number;
};

export default function CountryTabs({ countryCode, articleCount, placeCount }: Props) {
  const pathname = usePathname();

  const isArticles = pathname === `/${countryCode}/column` || pathname.startsWith(`/${countryCode}/column/`);
  const isplace = pathname.startsWith(`/${countryCode}/place`);
  const isJobs = pathname.startsWith(`/${countryCode}/jobs`);

  const tabs = [
    {
      href: `/${countryCode}/column`,
      label: "KAIコラム",
      count: articleCount,
      icon: <BookOpen size={14} />,
      active: isArticles,
    },
    {
      href: `/${countryCode}/place`,
      label: "KAIプレイス",
      count: placeCount,
      icon: <MapPin size={14} />,
      active: isplace,
    },
    {
      href: `/${countryCode}/jobs`,
      label: "KAIジョブ",
      count: null,
      icon: <BriefcaseBusiness size={14} />,
      active: isJobs,
    },
  ];

  return (
    <div className="bg-stone-900/80 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex w-full">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3.5 text-sm font-medium border-b-2 transition-colors min-w-0 ${
                tab.active
                  ? "border-warm-500 text-white"
                  : "border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-600"
              }`}
            >
              <span className={`shrink-0 ${tab.active ? "text-warm-400" : ""}`}>{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-xs tabular-nums shrink-0 ${tab.active ? "text-warm-400" : "text-stone-500"}`}>
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
