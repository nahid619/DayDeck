"use client";
// components/shell/TopNav.js
// Persistent two-row nav. Lives in plan layout so it never unmounts on plan switch.
// Fixes: theme persistence (#9), dead search removed (#10), loading indicator (#26),
//        tab arrows hidden when no overflow (#25).

import { useRef, useState, useEffect, useTransition } from "react";
import { useRouter, usePathname }                      from "next/navigation";
import styles from "./TopNav.module.css";

export default function TopNav({ allPlans, currentSlug }) {
  const router          = useRouter();
  const pathname        = usePathname();
  const trackRef        = useRef(null);
  const viewportRef     = useRef(null);
  const [offset, setOffset]         = useState(0);
  const [canScrollLeft,  setCsl]    = useState(false);
  const [canScrollRight, setCsr]    = useState(false);
  const [theme,  setTheme]          = useState("dark");
  const [isPending, startTransition] = useTransition();

  // ── Theme: read from localStorage on mount, persist on change
  useEffect(() => {
    const saved = localStorage.getItem("daydeck-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggleTheme() {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("daydeck-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  // ── Scroll active tab into view on slug change
  useEffect(() => {
    const activeBtn = trackRef.current?.querySelector(`[data-slug="${currentSlug}"]`);
    if (!activeBtn || !viewportRef.current) return;
    const vp     = viewportRef.current;
    const btnL   = activeBtn.offsetLeft;
    const btnR   = btnL + activeBtn.offsetWidth;
    const vpW    = vp.clientWidth;
    const maxOff = Math.max(0, trackRef.current.scrollWidth - vpW);
    let newOff   = offset;
    if (btnL < offset)            newOff = Math.max(0, btnL - 16);
    else if (btnR > offset + vpW) newOff = Math.min(maxOff, btnR - vpW + 16);
    setOffset(newOff);
  }, [currentSlug]); // eslint-disable-line

  // ── Detect overflow to show/hide scroll arrows (#25)
  useEffect(() => {
    function check() {
      if (!trackRef.current || !viewportRef.current) return;
      const maxOff = Math.max(0, trackRef.current.scrollWidth - viewportRef.current.clientWidth);
      setCsl(offset > 0);
      setCsr(offset < maxOff);
    }
    check();
    const ro = new ResizeObserver(check);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [offset]);

  function scrollTabs(dir) {
    if (!trackRef.current || !viewportRef.current) return;
    const vpW    = viewportRef.current.clientWidth;
    const maxOff = Math.max(0, trackRef.current.scrollWidth - vpW);
    setOffset(prev => Math.max(0, Math.min(maxOff, prev + dir * 140)));
  }

  function handleTabClick(slug) {
    if (slug === currentSlug) return;
    startTransition(() => {
      router.push(`/plan/${slug}`);
    });
  }

  const totalCards = allPlans.reduce((s, p) => s + (p.totalCards || 0), 0);

  return (
    <header className={styles.header}>
      {/* Loading bar — shown while navigating (#26) */}
      {isPending && <div className={styles.loadingBar} />}

      {/* ── Row 1 ── */}
      <div className={styles.row1}>
        <div className={styles.logo}>
          <span className={styles.logoDay}>Day</span>
          <span className={styles.logoDot} />
          <span className={styles.logoDeck}>Deck</span>
        </div>

        <div className={styles.r1Right}>
          <span className={`${styles.badge} ${styles.badgeGreen}`}>
            {allPlans.length} Plans
          </span>
          <span className={styles.badge}>{totalCards} Cards</span>
          <button className={styles.themeBtn} onClick={toggleTheme}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </div>

      {/* ── Row 2 — tabs ── */}
      <div className={styles.row2}>
        <button
          className={`${styles.arr} ${!canScrollLeft ? styles.arrHidden : ""}`}
          onClick={() => scrollTabs(-1)}
          aria-label="Scroll tabs left"
        >‹</button>

        <div className={styles.tabsViewport} ref={viewportRef}>
          <div
            className={styles.tabsTrack}
            ref={trackRef}
            style={{ transform: `translateX(-${offset}px)` }}
          >
            {allPlans.map(plan => (
              <button
                key={plan.slug}
                data-slug={plan.slug}
                className={`${styles.tabBtn} ${plan.slug === currentSlug ? styles.tabActive : ""} ${isPending ? styles.tabPending : ""}`}
                onClick={() => handleTabClick(plan.slug)}
              >
                {plan.tabLabel || plan.title}
              </button>
            ))}
          </div>
        </div>

        <button
          className={`${styles.arr} ${styles.arrRight} ${!canScrollRight ? styles.arrHidden : ""}`}
          onClick={() => scrollTabs(1)}
          aria-label="Scroll tabs right"
        >›</button>
      </div>
    </header>
  );
}
