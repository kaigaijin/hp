import { Metadata } from "next";
import { ReviewApp } from "./ReviewApp";

export const metadata: Metadata = {
  title: "プレイス精査 | Kaigaijin Admin",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return <ReviewApp />;
}
