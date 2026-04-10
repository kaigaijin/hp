import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const directoryDir = path.join(process.cwd(), "content", "directory");

// POST /api/review
// body: { country, category, slug, action: "delete" | "keep" }
export async function POST(req: NextRequest) {
  try {
    const { country, category, slug, action } = await req.json();

    if (!country || !category || !slug || !action) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    if (action !== "delete" && action !== "keep") {
      return NextResponse.json({ error: "action は delete または keep のみ有効です" }, { status: 400 });
    }

    const filePath = path.join(directoryDir, country, `${category}.json`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const places = JSON.parse(raw) as Array<Record<string, unknown>>;

    if (action === "delete") {
      const filtered = places.filter((s) => s.slug !== slug);
      if (filtered.length === places.length) {
        return NextResponse.json({ error: "スポットが見つかりません" }, { status: 404 });
      }
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
      return NextResponse.json({ success: true, action: "deleted" });
    }

    // keep: needs_review フラグを除去
    const updated = places.map((s) => {
      if (s.slug !== slug) return s;
      const { needs_review, review_note, ...rest } = s as Record<string, unknown>;
      void needs_review;
      void review_note;
      return rest;
    });

    const found = updated.some((s) => s.slug === slug);
    if (!found) {
      return NextResponse.json({ error: "スポットが見つかりません" }, { status: 404 });
    }

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
    return NextResponse.json({ success: true, action: "kept" });
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
}
