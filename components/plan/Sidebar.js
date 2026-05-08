"use client";
// components/plan/Sidebar.js
// Fix #12: scroll active card into view on selection change.

import { useState, useEffect, useRef } from "react";
import { CARD_TYPES }                  from "@/lib/cardSchema";
import styles                          from "./Sidebar.module.css";

export default function Sidebar({
  plan, phases, cards, flatCards,
  selectedCard, onSelect,
  search, onSearch, filteredCards,
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
    <aside className={styles.sidebar} ref={containerRef}>
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
        phases.map(phase => {
          const phaseCards = (cardsByPhase[phase.phaseId] || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const isOpen = openPhases[phase.phaseId] !== false;

          return (
            <div key={phase.phaseId} className={styles.phaseGroup}>
              <button className={styles.phaseHdr} onClick={() => togglePhase(phase.phaseId)}>
                <span className={`${styles.phaseArrow} ${isOpen ? styles.open : ""}`}>▶</span>
                <span className={styles.phaseLabel}>{phase.label}</span>
                <span className={styles.phaseCount}>{phaseCards.length}</span>
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

function CardLink({ card, cardType, isActive, activeRef, onClick }) {
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
      style={isActive && card.color ? { borderLeftColor: card.color } : {}}
    >
      <span className={styles.cardNum}>
        {cardType === CARD_TYPES.DAY_PLAN  && `${card.day || card.order}`}
        {cardType === CARD_TYPES.STORIES   && (card.storyId || card.order)}
        {cardType === CARD_TYPES.REFERENCE && (card.modNum || card.order || "#")}
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
