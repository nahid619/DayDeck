// app/admin/dashboard/page.js
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/authOptions";
import { getPlans }         from "@/lib/data";
import AdminShell           from "@/components/admin/AdminShell";

export const metadata = { title: "Dashboard — DayDeck Admin" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin");

  const plans = await getPlans();
  return <AdminShell initialPlans={JSON.parse(JSON.stringify(plans))} />;
}
