import { redirect } from "next/navigation";
import { countries } from "@/lib/countries";

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.code }));
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  redirect(`/${code}/column`);
}
