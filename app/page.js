// app/page.js
// Root redirects to the first plan so the URL is always /plan/[slug].
// force-dynamic ensures the redirect picks up any plan order changes.
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getPlans } from "@/lib/data";

export default async function RootPage() {
  const plans = await getPlans();
  if (!plans.length) redirect("/admin");
  redirect(`/plan/${plans[0].slug}`);
}
