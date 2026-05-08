"use client";
// components/admin/AdminShell.js
// Issues fixed: #16 toast feedback, #18 breadcrumb as buttons, #19 mobile tab disabled states.

import { useState, useCallback } from "react";
import { signOut }         from "next-auth/react";
import PlansManager        from "./PlansManager";
import PhasesManager       from "./PhasesManager";
import CardsManager        from "./CardsManager";
import styles              from "./AdminShell.module.css";

export default function AdminShell({ initialPlans }) {
  const [plans,         setPlans]         = useState(initialPlans);
  const [selectedPlan,  setSelectedPlan]  = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [activeTab,     setActiveTab]     = useState("plans");
  const [toasts,        setToasts]        = useState([]);

  // Toast system (#16)
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  function handleSelectPlan(plan) {
    setSelectedPlan(plan);
    setSelectedPhase(null);
    setActiveTab("phases");
  }

  function handleSelectPhase(phase) {
    setSelectedPhase(phase);
    setActiveTab("cards");
  }

  const canAccessPhases = !!selectedPlan;
  const canAccessCards  = !!selectedPlan && !!selectedPhase;

  return (
    <div className={styles.shell}>
      {/* Toast container (#16) */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
            {t.type === "success" ? "✓" : "✕"} {t.message}
          </div>
        ))}
      </div>

      {/* ── Top bar ── */}
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoDay}>Day</span>
          <span className={styles.logoDot} />
          <span className={styles.logoDeck}>Deck</span>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        {/* Breadcrumb — now uses <button> (#18) */}
        <nav className={styles.breadcrumb} aria-label="Admin navigation">
          <button
            className={`${styles.crumb} ${!selectedPlan ? styles.crumbActive : ""}`}
            onClick={() => { setSelectedPlan(null); setSelectedPhase(null); setActiveTab("plans"); }}
          >Plans</button>
          {selectedPlan && (
            <>
              <span className={styles.crumbSep} aria-hidden>›</span>
              <button
                className={`${styles.crumb} ${selectedPlan && !selectedPhase ? styles.crumbActive : ""}`}
                onClick={() => { setSelectedPhase(null); setActiveTab("phases"); }}
              >{selectedPlan.title}</button>
            </>
          )}
          {selectedPhase && (
            <>
              <span className={styles.crumbSep} aria-hidden>›</span>
              <button className={`${styles.crumb} ${styles.crumbActive}`}>
                {selectedPhase.label}
              </button>
            </>
          )}
        </nav>

        <div className={styles.topRight}>
          <a href="/" target="_blank" className={styles.viewSiteBtn}>↗ View Site</a>
          <button className={styles.signOutBtn} onClick={() => signOut({ callbackUrl: "/admin" })}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Three panels ── */}
      <div className={styles.panels}>
        <div className={`${styles.panel} ${styles.panelPlans} ${activeTab !== "plans" ? styles.panelHidden : ""}`}>
          <PlansManager
            plans={plans}
            setPlans={setPlans}
            selectedPlan={selectedPlan}
            onSelectPlan={handleSelectPlan}
            onToast={addToast}
          />
        </div>

        <div className={`${styles.panel} ${styles.panelPhases} ${activeTab !== "phases" ? styles.panelHidden : ""}`}>
          {selectedPlan ? (
            <PhasesManager
              plan={selectedPlan}
              selectedPhase={selectedPhase}
              onSelectPhase={handleSelectPhase}
              onPlanUpdated={updatedPlan =>
                setPlans(prev => prev.map(p => p._id === updatedPlan._id ? updatedPlan : p))
              }
              onToast={addToast}
            />
          ) : (
            <div className={styles.emptyPanel}>
              <span className={styles.emptyIcon}>←</span>
              <p>Select a plan first</p>
            </div>
          )}
        </div>

        <div className={`${styles.panel} ${styles.panelCards} ${activeTab !== "cards" ? styles.panelHidden : ""}`}>
          {selectedPlan && selectedPhase ? (
            <CardsManager plan={selectedPlan} phase={selectedPhase} onToast={addToast} />
          ) : (
            <div className={styles.emptyPanel}>
              <span className={styles.emptyIcon}>{selectedPlan ? "←" : "←←"}</span>
              <p>{selectedPlan ? "Select a phase to manage cards" : "Select a plan, then a phase"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav (#19: disabled states) */}
      <nav className={styles.mobileNav}>
        <button
          className={`${styles.mobileTab} ${activeTab === "plans" ? styles.mobileTabActive : ""}`}
          onClick={() => setActiveTab("plans")}
        >📚 Plans</button>
        <button
          className={`${styles.mobileTab} ${activeTab === "phases" ? styles.mobileTabActive : ""} ${!canAccessPhases ? styles.mobileTabDisabled : ""}`}
          onClick={() => canAccessPhases && setActiveTab("phases")}
          disabled={!canAccessPhases}
          title={!canAccessPhases ? "Select a plan first" : ""}
        >📂 Phases</button>
        <button
          className={`${styles.mobileTab} ${activeTab === "cards" ? styles.mobileTabActive : ""} ${!canAccessCards ? styles.mobileTabDisabled : ""}`}
          onClick={() => canAccessCards && setActiveTab("cards")}
          disabled={!canAccessCards}
          title={!canAccessCards ? "Select a plan and phase first" : ""}
        >🃏 Cards</button>
      </nav>
    </div>
  );
}
