"use client";
// components/shell/TopNav.js

import { useRef, useState, useEffect, useLayoutEffect, useTransition } from "react";
import { useRouter, usePathname }                      from "next/navigation";
import Link                                            from "next/link";
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
  const [menuOpen,  setMenuOpen]    = useState(false);

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
  // scrollWidth on a transformed flex container is unreliable in some browsers.
  // Summing each tab button's offsetWidth is transform-immune and always correct.
  function getMaxOffset() {
    if (!trackRef.current || !viewportRef.current) return 0;
    const totalTabsWidth = Array.from(trackRef.current.children)
      .reduce((sum, t) => sum + t.offsetWidth, 0);
    return Math.max(0, totalTabsWidth - viewportRef.current.clientWidth);
  }

  useLayoutEffect(() => {
    function check() {
      const maxOff = getMaxOffset();
      setCsl(offset > 0);
      setCsr(offset < maxOff);
    }
    check();
    const ro = new ResizeObserver(check);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (trackRef.current)    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [offset]); // eslint-disable-line

  function scrollTabs(dir) {
    const maxOff = getMaxOffset();
    setOffset(prev => Math.max(0, Math.min(maxOff, prev + dir * 140)));
  }

  function handleTabClick(slug) {
    if (slug === currentSlug) return;
    setMenuOpen(false);
    startTransition(() => {
      router.push(`/plan/${slug}`);
    });
  }

  const totalCards   = allPlans.reduce((s, p) => s + (p.totalCards || 0), 0);
  const currentPlan  = allPlans.find(p => p.slug === currentSlug);

  return (
    <>
      {/* ── Full-screen pulse overlay while navigating ── */}
      {isPending && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingRing}>
            <div className={styles.loadingDot} />
          </div>
        </div>
      )}

      <header className={styles.header}>

        {/* ── Row 1 ── */}
        <div className={styles.row1}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoDay}>Day</span>
            <span className={styles.logoDot} />
            <span className={styles.logoDeck}>Deck</span>
          </Link>

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

        {/* ── Row 2 — tabs (desktop) + hamburger (mobile) ── */}
        <div className={styles.row2}>

          {/* Desktop tab track */}
          <div className={styles.tabsDesktop}>
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

          {/* Mobile: current plan label + hamburger */}
          <div className={styles.tabsMobile}>
            <span className={styles.currentLabel}>
              {currentPlan?.emoji && <span>{currentPlan.emoji}</span>}
              {currentPlan?.tabLabel || currentPlan?.title || "Plans"}
            </span>
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle navigation"
            >
              <span className={styles.hamLine} />
              <span className={styles.hamLine} />
              <span className={styles.hamLine} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <>
            <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
            <nav className={styles.menuDropdown}>
              {allPlans.map(plan => (
                <button
                  key={plan.slug}
                  className={`${styles.menuItem} ${plan.slug === currentSlug ? styles.menuItemActive : ""}`}
                  onClick={() => handleTabClick(plan.slug)}
                >
                  {plan.emoji && <span className={styles.menuEmoji}>{plan.emoji}</span>}
                  <span className={styles.menuLabel}>{plan.tabLabel || plan.title}</span>
                  {plan.slug === currentSlug && <span className={styles.menuCheck}>✓</span>}
                </button>
              ))}
            </nav>
          </>
        )}

      </header>
    </>
  );
}
