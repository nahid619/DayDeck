// app/plan/[slug]/page.js
// Server component — fetches plan data, passes to client PlanView.
// TopNav is now in layout.js and persists across plan switches.
export const dynamic = "force-dynamic";

import { notFound }                             from "next/navigation";
import { getPlanBySlug, getPhasesByPlan, getCardsByPlan } from "@/lib/data";
import { Suspense }  from "react";
import PlanView from "@/components/plan/PlanView";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const plan = await getPlanBySlug(slug);
  return { title: plan ? `${plan.title} — DayDeck` : "DayDeck" };
}

export default async function PlanPage({ params, searchParams }) {
  const { slug } = await params;
  const sp       = await searchParams;

  const plan = await getPlanBySlug(slug);
  if (!plan) notFound();

  const [phases, cards] = await Promise.all([
    getPhasesByPlan(slug),
    getCardsByPlan(slug),
  ]);

  const serialise = (obj) => JSON.parse(JSON.stringify(obj));

  return (
    <Suspense>
      <PlanView
        plan={serialise(plan)}
        phases={serialise(phases)}
        cards={serialise(cards)}
        initialCardId={sp?.card || null}
      />
    </Suspense>
  );
}
