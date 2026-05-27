"use client";
// components/plan/Sidebar.js
// Fix #12: scroll active card into view on selection change.

import { useState, useEffect, useRef } from "react";
import { CARD_TYPES }                  from "@/lib/cardSchema";
import { getPhaseColor }               from "./DetailPanel";
import styles                          from "./Sidebar.module.css";

export default function Sidebar({
  plan, phases, cards, flatCards,
  selectedCard, onSelect,
  search, onSearch, filteredCards,
  isOpen, onClose,
}) {
  const [openPhases, setOpenPhases] = useState(() =>
    Object.fromEntries(phases.map(p => [p.phaseId, true]))
  );
  const activeRef    = useRef(null);
  const containerRef = useRef(null);

  // Reset open state when plan changes
  useEffect(() => {
    setOpenPhases(Object.fromEntries(phases.map(p => [p.phaseId, true])));
  }, [plan.slug]); // eslint-disable-line

  // Scroll active card into view when it changes (#12)
  useEffect(() => {
    if (!activeRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const el        = activeRef.current;
    const elTop     = el.offsetTop;
    const elBot     = elTop + el.offsetHeight;
    const conTop    = container.scrollTop;
    const conBot    = conTop + container.clientHeight;
    if (elTop < conTop + 40)        container.scrollTop = elTop - 40;
    else if (elBot > conBot - 40)   container.scrollTop = elBot - container.clientHeight + 40;
  }, [selectedCard?._id]);

  function togglePhase(id) {
    setOpenPhases(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const cardsByPhase = {};
  cards.forEach(c => {
    const key = c.phase || "default";
    if (!cardsByPhase[key]) cardsByPhase[key] = [];
    cardsByPhase[key].push(c);
  });

  const isSearching = !!(search.trim() && filteredCards);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`} ref={containerRef}>
      <div className={styles.searchRow}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Filter this plan…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => onSearch("")}>×</button>
        )}
        {/* Mobile close button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">✕</button>
      </div>

      <div className={styles.planLabel}>{plan.title}</div>

      {isSearching ? (
        <div className={styles.searchResults}>
          {filteredCards.length === 0 ? (
            <div className={styles.noResults}>No results for "{search}"</div>
          ) : (
            filteredCards.map(card => (
              <CardLink
                key={card._id}
                card={card}
                cardType={plan.cardType}
                isActive={selectedCard?._id === card._id}
                activeRef={selectedCard?._id === card._id ? activeRef : null}
                onClick={() => onSelect(card)}
              />
            ))
          )}
        </div>
      ) : (
        phases.map((phase, phaseIdx) => {
          const phaseCards = (cardsByPhase[phase.phaseId] || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const isOpen = openPhases[phase.phaseId] !== false;
          const pc     = getPhaseColor(phaseIdx);

          return (
            <div key={phase.phaseId} className={styles.phaseGroup}>
              <button
                className={styles.phaseHdr}
                onClick={() => togglePhase(phase.phaseId)}
                style={{ borderLeftColor: pc.accent }}
              >
                <span className={`${styles.phaseArrow} ${isOpen ? styles.open : ""}`}>▶</span>
                <span className={styles.phaseLabel} style={{ color: pc.text }}>{phase.label}</span>
                <span
                  className={styles.phaseCount}
                  style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text }}
                >
                  {phaseCards.length}
                </span>
              </button>

              {isOpen && (
                <div className={styles.phaseCards}>
                  {phaseCards.map(card => (
                    <CardLink
                      key={card._id}
                      card={card}
                      cardType={plan.cardType}
                      isActive={selectedCard?._id === card._id}
                      activeRef={selectedCard?._id === card._id ? activeRef : null}
                      activeColor={pc.accent}
                      onClick={() => onSelect(card)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </aside>
  );
}

function CardLink({ card, cardType, isActive, activeRef, activeColor, onClick }) {
  const effortDotClass = {
    light:  styles.dotLight,
    normal: styles.dotNormal,
    heavy:  styles.dotHeavy,
  }[card.effort] || "";

  return (
    <button
      ref={isActive ? activeRef : null}
      className={`${styles.cardLink} ${isActive ? styles.cardLinkActive : ""}`}
      onClick={onClick}
      style={isActive ? { borderLeftColor: activeColor || "var(--accent)" } : {}}
    >
      <span className={styles.cardNum}>
        {cardType === CARD_TYPES.DAY_PLAN  && `${card.day || card.order}`}
        {cardType === CARD_TYPES.STORIES   && (card.storyId || card.order)}
        {cardType === CARD_TYPES.REFERENCE && (card.modNum || card.order || "#")}
        {cardType === CARD_TYPES.FLEX       && (card.badge || `Q${card.order ?? 1}`)}
      </span>
      <span className={styles.cardLabel}>
        {typeof card.topic === "string" ? card.topic
          : typeof card.title === "string" ? card.title
          : "Untitled"}
      </span>
      {cardType === CARD_TYPES.DAY_PLAN && (
        <span className={`${styles.dot} ${effortDotClass}`} />
      )}
      {cardType === CARD_TYPES.STORIES && card.part && (
        <span className={styles.partBadge}>{String(card.part).toUpperCase()}</span>
      )}
    </button>
  );
}
