// app/plan/[slug]/layout.js
// Persistent shell for all plan pages.
// TopNav lives here so it stays mounted when switching between plans —
// preventing the "whole page refresh" feel.

import { getPlans } from "@/lib/data";
import TopNav       from "@/components/shell/TopNav";

export default async function PlanLayout({ children, params }) {
  const { slug }  = await params;
  const allPlans  = await getPlans();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      overflow: "hidden",
      background: "var(--bg)",
    }}>
      <TopNav allPlans={JSON.parse(JSON.stringify(allPlans))} currentSlug={slug} />
      {children}
    </div>
  );
}
