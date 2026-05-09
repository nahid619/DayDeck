"use client";
// components/plan/PlanView.js
// Fixes: auto-select first card (#23), URL persistence (#24), expanded search (#4).

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams }            from "next/navigation";
import { CARD_TYPES }                            from "@/lib/cardSchema";
import Sidebar      from "./Sidebar";
import DayContent   from "./DayContent";
import DetailPanel  from "./DetailPanel";
import styles       from "./PlanView.module.css";

export default function PlanView({ plan, phases, cards, initialCardId }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [selectedCard,  setSelectedCard]  = useState(null);
  const [search,        setSearch]        = useState("");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const didInit = useRef(false);

  // Build flat ordered card list
  const flatCards = useMemo(() => {
    const phaseOrder = {};
    phases.forEach((p, i) => { phaseOrder[p.phaseId] = i; });
    return [...cards].sort((a, b) => {
      const pa = phaseOrder[a.phase] ?? 99;
      const pb = phaseOrder[b.phase] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.order || 0) - (b.order || 0);
    });
  }, [cards, phases]);

  // Auto-select: initialCardId from URL → or first card (#23, #24)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (!flatCards.length) return;

    const target = initialCardId
      ? flatCards.find(c => c._id === initialCardId)
      : flatCards[0];

    if (target) setSelectedCard(target);
  }, [flatCards, initialCardId]);

  // Persist selected card id in URL without full navigation (#24)
  function selectCard(card) {
    setSelectedCard(card);
    if (card) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("card", card._id);
      router.replace(`/plan/${plan.slug}?${params.toString()}`, { scroll: false });
    }
  }

  // Expanded search (#4): topic, title, storyId, userStory, practice, why
  const filteredCards = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return flatCards.filter(c =>
      (c.topic     || c.title || "").toLowerCase().includes(q) ||
      (c.storyId   || "").toLowerCase().includes(q)            ||
      (c.userStory || "").toLowerCase().includes(q)            ||
      (c.practice  || "").toLowerCase().includes(q)            ||
      (c.why       || "").toLowerCase().includes(q)
    );
  }, [search, flatCards]);

  function navigate(dir) {
    const list = filteredCards || flatCards;
    if (!list.length) return;
    const idx  = selectedCard ? list.findIndex(c => c._id === selectedCard._id) : -1;
    const next = list[Math.max(0, Math.min(list.length - 1, idx + dir))];
    if (next) selectCard(next);
  }

  const displayList = filteredCards || flatCards;
  const selectedIdx = selectedCard ? displayList.findIndex(c => c._id === selectedCard._id) : -1;

  return (
    <div className={styles.body}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar open button */}
      <button
        className={styles.sidebarToggle}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        ☰
      </button>

      <Sidebar
        plan={plan}
        phases={phases}
        cards={cards}
        flatCards={flatCards}
        selectedCard={selectedCard}
        onSelect={(card) => { selectCard(card); setSidebarOpen(false); }}
        search={search}
        onSearch={setSearch}
        filteredCards={filteredCards}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <DayContent
        plan={plan}
        card={selectedCard}
        onNavigate={navigate}
        hasPrev={selectedIdx > 0}
        hasNext={selectedIdx >= 0 && selectedIdx < displayList.length - 1}
      />
      <DetailPanel
        plan={plan}
        phases={phases}
        cards={cards}
        selectedCard={selectedCard}
      />
    </div>
  );
}