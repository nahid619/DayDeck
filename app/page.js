// app/page.js
export const dynamic = "force-dynamic";

import { getPlans } from "@/lib/data";
import { redirect } from "next/navigation";
import HomeView     from "./HomeView";

export default async function RootPage() {
  const plans = await getPlans();
  if (!plans.length) redirect("/admin");
  return <HomeView plans={JSON.parse(JSON.stringify(plans))} />;
}