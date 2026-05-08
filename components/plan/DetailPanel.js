"use client";
// components/plan/DetailPanel.js
// Right-side contextual panel — shows plan overview + selected card details.

import { CARD_TYPES } from "@/lib/cardSchema";
import styles         from "./DetailPanel.module.css";

// Phase color palette — cycles every 8 phases
const PHASE_COLORS = [
  { accent: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.30)",  text: "#93c5fd"  },
  { accent: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.30)",  text: "#6ee7b7"  },
  { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.30)",  text: "#fcd34d"  },
  { accent: "#ec4899", bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.30)",  text: "#f9a8d4"  },
  { accent: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.30)", text: "#c4b5fd"  },
  { accent: "#22d3ee", bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.30)",  text: "#a5f3fc"  },
  { accent: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.30)",  text: "#fdba74"  },
  { accent: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.30)",  text: "#a7f3d0"  },
];

export function getPhaseColor(phaseIndex) {
  return PHASE_COLORS[phaseIndex % PHASE_COLORS.length];
}

export default function DetailPanel({ plan, phases, cards, selectedCard }) {
  const totalCards  = cards.length;
  const totalPhases = phases.length;

  // Find phase info for selected card
  const phaseIndex  = selectedCard ? phases.findIndex(p => p.phaseId === selectedCard.phase) : -1;
  const phaseInfo   = phaseIndex >= 0 ? phases[phaseIndex] : null;
  const phaseColor  = phaseIndex >= 0 ? getPhaseColor(phaseIndex) : null;

  // Card type label
  const cardTypeLabel =
    plan.cardType === CARD_TYPES.DAY_PLAN  ? "Study Plan" :
    plan.cardType === CARD_TYPES.STORIES   ? "User Stories" :
    "Reference";

  return (
    <aside className={styles.panel}>

      {/* ── Plan Overview ── */}
      <div className={styles.planCard}>
        <div className={styles.planEmoji}>{plan.emoji || "📚"}</div>
        <div className={styles.planTitle}>{plan.fullTitle || plan.title}</div>
        <div className={styles.planMeta}>{cardTypeLabel}</div>

        <div className={styles.statsRow}>
          <StatChip value={totalCards}  label="Cards"  />
          <StatChip value={totalPhases} label="Phases" />
        </div>
      </div>

      {/* ── Card details (when selected) ── */}
      {selectedCard ? (
        <div className={styles.cardDetails}>

          {/* Phase badge */}
          {phaseInfo && phaseColor && (
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Phase</div>
              <div
                className={styles.phasePill}
                style={{ background: phaseColor.bg, border: `1px solid ${phaseColor.border}`, color: phaseColor.text }}
              >
                <span className={styles.phaseDot} style={{ background: phaseColor.accent }} />
                {phaseInfo.label}
              </div>
            </div>
          )}

          {/* Card type specific metadata */}
          {plan.cardType === CARD_TYPES.DAY_PLAN && <DayPlanMeta card={selectedCard} />}
          {plan.cardType === CARD_TYPES.STORIES  && <StoriesMeta card={selectedCard} />}
          {plan.cardType === CARD_TYPES.REFERENCE && <ReferenceMeta card={selectedCard} />}

          {/* Gains / skills */}
          {selectedCard.gains?.length > 0 && (
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Skills gained</div>
              <div className={styles.tagCloud}>
                {selectedCard.gains.map((g, i) => (
                  <span key={i} className={styles.gainTag}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {selectedCard.sources?.length > 0 && (
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Resources</div>
              <div className={styles.sourcesList}>
                {selectedCard.sources.map((s, i) => (
                  <SourceItem key={i} source={s} />
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>👈</div>
          <div className={styles.emptyText}>Select a card from the sidebar to see details here</div>
        </div>
      )}
    </aside>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function StatChip({ value, label }) {
  return (
    <div className={styles.statChip}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function DayPlanMeta({ card }) {
  const effortColors = {
    light:  { bg: "var(--effort-light-bg)",  color: "var(--effort-light-text)"  },
    normal: { bg: "var(--effort-normal-bg)", color: "var(--effort-normal-text)" },
    heavy:  { bg: "var(--effort-heavy-bg)",  color: "var(--effort-heavy-text)"  },
  };
  const ec = effortColors[card.effort] || effortColors.normal;

  return (
    <>
      <div className={styles.metaRow}>
        {card.day && (
          <MetaBadge label="Day" value={card.day} />
        )}
        {card.weekLabel && (
          <MetaBadge label="Week" value={card.weekLabel} />
        )}
      </div>

      {card.effort && (
        <div className={styles.detailBlock}>
          <div className={styles.detailLabel}>Effort</div>
          <div
            className={styles.effortPill}
            style={{ background: ec.bg, color: ec.color }}
          >
            ● {card.effort.charAt(0).toUpperCase() + card.effort.slice(1)}
            {card.timeEstimate && <> · {card.timeEstimate}</>}
          </div>
        </div>
      )}
    </>
  );
}

function StoriesMeta({ card }) {
  return (
    <>
      <div className={styles.metaRow}>
        {card.storyId && <MetaBadge label="Story" value={`#${card.storyId}`} />}
        {card.part    && <MetaBadge label="Part"  value={String(card.part).toUpperCase()} />}
      </div>
      {card.sectionTitle && (
        <div className={styles.detailBlock}>
          <div className={styles.detailLabel}>Section</div>
          <div className={styles.sectionText}>{card.sectionTitle}</div>
        </div>
      )}
    </>
  );
}

function ReferenceMeta({ card }) {
  return (
    <>
      {card.difficulty && (
        <div className={styles.detailBlock}>
          <div className={styles.detailLabel}>Difficulty</div>
          <MetaBadge label="" value={card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1)} />
        </div>
      )}
      {card.filter && (
        <div className={styles.detailBlock}>
          <div className={styles.detailLabel}>Category</div>
          <div className={styles.sectionText}>{card.filter}</div>
        </div>
      )}
    </>
  );
}

function MetaBadge({ label, value }) {
  return (
    <div className={styles.metaBadge}>
      {label && <span className={styles.metaBadgeLabel}>{label}</span>}
      <span className={styles.metaBadgeValue}>{value}</span>
    </div>
  );
}

function SourceItem({ source }) {
  const typeMap = {
    trail: { icon: "T", bg: "var(--res-trail-bg)", color: "var(--res-trail-text)" },
    tool:  { icon: "⚙", bg: "var(--res-tool-bg)",  color: "var(--res-tool-text)"  },
    ref:   { icon: "R", bg: "var(--res-docs-bg)",   color: "var(--res-docs-text)"  },
    video: { icon: "▶", bg: "var(--res-video-bg)",  color: "var(--res-video-text)" },
  };
  const tm = typeMap[source.b] || typeMap.ref;

  const inner = (
    <div className={styles.sourceItem}>
      <div className={styles.sourceIcon} style={{ background: tm.bg, color: tm.color }}>
        {tm.icon}
      </div>
      <span className={styles.sourceTitle}>{source.t}</span>
      <span className={styles.sourceBadge} style={{ background: tm.bg, color: tm.color }}>
        {source.b || "docs"}
      </span>
    </div>
  );

  return source.u
    ? <a href={source.u} target="_blank" rel="noopener noreferrer">{inner}</a>
    : inner;
}