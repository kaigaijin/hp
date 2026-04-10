import { getNeedsReviewplaces } from "@/lib/directory";
import { AlertTriangle } from "lucide-react";
import { ReviewList } from "./ReviewList";

export const metadata = {
  title: "要確認スポット一覧 | Kaigaijin Admin",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  const places = getNeedsReviewplaces();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-amber-500 text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <AlertTriangle size={22} />
          <div>
            <h1 className="text-lg font-bold">要確認スポット一覧</h1>
            <p className="text-amber-100 text-sm">
              掲載・削除ボタンで判断してください — 即時ファイルに反映されます
            </p>
          </div>
          <span className="ml-auto bg-white text-amber-600 font-bold text-sm px-3 py-1 rounded-full">
            {places.length}件
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <ReviewList initialplaces={places} />

        {/* 操作ガイド */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          <h3 className="font-bold text-gray-800 mb-2">操作方法</h3>
          <ul className="space-y-1 text-xs leading-relaxed">
            <li>• 公式サイトを開いて日本人向けかどうか確認</li>
            <li>• <strong>掲載する</strong>: needs_review フラグを除去してサイトに表示</li>
            <li>• <strong>削除する</strong>: JSONから完全に削除</li>
            <li>• ファイルは即時書き換えられますが、サイトへの反映はデプロイ後になります</li>
            <li>• 全件確認後、pushしてデプロイすると本番に反映</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
