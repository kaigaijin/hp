"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MapPin, BriefcaseBusiness } from "lucide-react";

type Props = {
  countryCode: string;
  articleCount: number;
  spotCount: number;
};

export default function CountryTabs({ countryCode, articleCount, spotCount }: Props) {
  const pathname = usePathname();

  const isArticles = pathname === `/${countryCode}`;
  const isSpot = pathname.startsWith(`/${countryCode}/spot`);
  const isJobs = pathname.startsWith(`/${countryCode}/jobs`);

  const tabs = [
    {
      href: `/${countryCode}`,
      label: "記事",
      count: articleCount,
      icon: <BookOpen size={14} />,
      active: isArticles,
    },
    {
      href: `/${countryCode}/spot`,
      label: "KAIスポット",
      count: spotCount,
      icon: <MapPin size={14} />,
      active: isSpot,
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
    <div className="sticky top-16 z-40 bg-stone-900/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab.active
                  ? "border-warm-500 text-white"
                  : "border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-600"
              }`}
            >
              <span className={tab.active ? "text-warm-400" : ""}>{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs tabular-nums ${tab.active ? "text-warm-400" : "text-stone-500"}`}>
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
