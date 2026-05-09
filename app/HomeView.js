"use client";
// app/HomeView.js

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { CARD_TYPES }          from "@/lib/cardSchema";
import styles                  from "./home.module.css";

const TYPE_LABEL = {
  [CARD_TYPES.DAY_PLAN]:  "Study Plan",
  [CARD_TYPES.STORIES]:   "User Stories",
  [CARD_TYPES.REFERENCE]: "Reference",
};

export default function HomeView({ plans }) {
  const router = useRouter();
  const [theme,      setTheme]      = useState("dark");
  const [navigating, setNavigating] = useState(false);

  // Sync theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("daydeck-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggleTheme() {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("daydeck-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  const totalCards = plans.reduce((sum, p) => sum + (p.totalCards || 0), 0);

  return (
    <div className={styles.page}>

      {/* ── Navigation loading overlay ── */}
      {navigating && (
        <div className={styles.navOverlay}>
          <div className={styles.navRing}>
            <div className={styles.navDot} />
          </div>
        </div>
      )}

      {/* ── Top Nav ── */}
      <header className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoDay}>DAY</span>
          <span className={styles.logoDot} />
          <span className={styles.logoDeck}>DECK</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.statBadge}>{plans.length} Plans</span>
          <span className={styles.statBadge}>{totalCards} Cards</span>
          <button className={styles.themeBtn} onClick={toggleTheme}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>Study Dashboard</div>
        <h1 className={styles.heroTitle}>
          Your Study<br />
          <span className={styles.heroAccent}>Command Center</span>
        </h1>
        <p className={styles.heroSub}>
          {totalCards} cards across {plans.length} structured learning plans.
          Pick a plan and start where you left off.
        </p>
      </section>

      {/* ── Plan Grid ── */}
      <main className={styles.grid}>
        {plans.map((plan, i) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            index={i}
            onClick={() => {
              setNavigating(true);
              router.push(`/plan/${plan.slug}`);
            }}
          />
        ))}
      </main>

    </div>
  );
}

function PlanCard({ plan, index, onClick }) {
  const label = TYPE_LABEL[plan.cardType] || plan.cardType;
  const color = plan.color || "var(--accent)";

  return (
    <button
      className={styles.card}
      onClick={onClick}
      style={{
        "--card-color": color,
        animationDelay: `${index * 45}ms`,
      }}
    >
      {/* Accent bar */}
      <div className={styles.cardBar} style={{ background: color }} />

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardEmoji}>{plan.emoji}</div>
        <div className={styles.cardTitle}>{plan.title}</div>
        <div className={styles.cardSub}>{plan.fullTitle}</div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.typeBadge}>{label}</span>
        <span className={styles.cardCount}>{plan.totalCards || 0} cards →</span>
      </div>
    </button>
  );
}