"use client";
// components/plan/DayContent.js

import { CARD_TYPES } from "@/lib/cardSchema";
import styles         from "./DayContent.module.css";

export default function DayContent({ plan, card, onNavigate, hasPrev, hasNext }) {
  if (!card) {
    const emptyLabel =
      plan.cardType === CARD_TYPES.STORIES   ? "Pick a story from the sidebar to begin" :
      plan.cardType === CARD_TYPES.REFERENCE  ? "Pick an entry from the sidebar to begin" :
      "Pick a day from the sidebar to begin studying";

    return (
      <main className={styles.main}>
        <div className={styles.contentHdr}>
          <span className={styles.contentTitle}>Select an item from the sidebar</span>
          <div className={styles.navBtns}>
            <button className={styles.navBtn} disabled>← Prev</button>
            <button className={`${styles.navBtn} ${styles.navBtnGo}`} disabled>Next →</button>
          </div>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📚</span>
          <span className={styles.emptyText}>{emptyLabel}</span>
        </div>
      </main>
    );
  }

  const titleText =
    plan.cardType === CARD_TYPES.DAY_PLAN  ? `Day ${card.day || card.order} — ${card.topic}` :
    plan.cardType === CARD_TYPES.STORIES   ? `#${card.storyId} — ${card.title}` :
    card.title || card.topic || "Reference";

  const accentStyle = card.color ? { "--card-color": card.color } : {};

  return (
    <main className={styles.main} style={accentStyle}>
      <div className={styles.contentHdr}>
        <span className={styles.contentTitle}>{titleText}</span>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={() => onNavigate(-1)} disabled={!hasPrev}>← Prev</button>
          <button className={`${styles.navBtn} ${styles.navBtnGo}`} onClick={() => onNavigate(1)} disabled={!hasNext}>Next →</button>
        </div>
      </div>

      <div className={styles.contentBody} key={card?._id}>
        {plan.cardType === CARD_TYPES.DAY_PLAN  && <DayPlanCard  card={card} />}
        {plan.cardType === CARD_TYPES.STORIES   && <StoriesCard  card={card} />}
        {plan.cardType === CARD_TYPES.REFERENCE && <ReferenceCard card={card} />}
      </div>
    </main>
  );
}

function DayPlanCard({ card }) {
  const effortCls = {
    light:  styles.effortLight,
    normal: styles.effortNormal,
    heavy:  styles.effortHeavy,
  }[card.effort] || styles.effortNormal;

  const dayTypeIcon = { project:"🏗", reference:"📖", learning:"🎓" }[card.dayType] || null;

  return (
    <>
      {card.color && <div className={styles.colorBar} style={{ background: card.color }} />}
      <div className={styles.dayBadge}>
        Day {card.day || card.order}
        {card.weekLabel && <> · {card.weekLabel}</>}
      </div>
      <h1 className={styles.dayTitle}>{card.topic}</h1>

      <div className={styles.badgeRow}>
        <div className={`${styles.effortBadge} ${effortCls}`}>
          ● {(card.effort||"normal").charAt(0).toUpperCase()+(card.effort||"normal").slice(1)} effort
          {card.timeEstimate && <> · {card.timeEstimate}</>}
        </div>
        {card.dayType && (
          <div className={styles.dayTypeBadge}>
            {dayTypeIcon && <>{dayTypeIcon} </>}
            {card.dayType.charAt(0).toUpperCase()+card.dayType.slice(1)}
          </div>
        )}
      </div>

      {card.topics?.length > 0 && (
        <Section label="What you'll learn">
          <div className={styles.topicsList}>
            {card.topics.map((t, i) => <div key={i} className={styles.topicItem}>{t}</div>)}
          </div>
        </Section>
      )}
      {card.practice && (
        <Section label="Practice task">
          <div className={styles.practiceBox}>{card.practice}</div>
        </Section>
      )}
      {card.concepts?.length > 0 && (
        <Section label="Key concepts">
          <div className={styles.topicsList}>
            {card.concepts.map((c, i) => <ConceptItem key={i} item={c} />)}
          </div>
        </Section>
      )}
      {card.gains?.length > 0 && (
        <Section label="Skills gained">
          <div className={styles.tagsList}>
            {card.gains.map((g, i) => <span key={i} className={styles.gainTag}>{g}</span>)}
          </div>
        </Section>
      )}
      {card.sources?.length > 0 && (
        <Section label="Sources & resources">
          <div className={styles.sourcesList}>
            {card.sources.map((s, i) => <SourceRow key={i} source={s} />)}
          </div>
        </Section>
      )}
    </>
  );
}

function StoriesCard({ card }) {
  return (
    <>
      {card.color && <div className={styles.colorBar} style={{ background: card.color }} />}
      <div className={styles.dayBadge}>
        Story #{card.storyId}
        {card.sectionTitle && <> · {card.sectionTitle}</>}
      </div>
      <h1 className={styles.dayTitle}>{card.title}</h1>
      {card.part && <div className={styles.partBadge}>{String(card.part).toUpperCase()}</div>}

      {card.userStory && (
        <Section label="User story">
          <div className={styles.userStoryBox}>{card.userStory}</div>
        </Section>
      )}
      {card.acceptanceCriteria?.length > 0 && (
        <Section label="Acceptance criteria">
          <div className={styles.acList}>
            {card.acceptanceCriteria.map((ac, i) => (
              <div key={i} className={styles.acItem}>
                <span className={styles.acNum}>{i + 1}</span>
                <span>{ac}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function ReferenceCard({ card }) {
  const sec = (card.sec && typeof card.sec === "object") ? card.sec : {};
  const hasSecContent = Object.keys(sec).length > 0;

  return (
    <>
      {card.color && <div className={styles.colorBar} style={{ background: card.color }} />}
      {card.topic && (
        <div className={styles.dayBadge}>
          {card.modTitle || (typeof card.filter==="string" ? card.filter : "") || card.topic}
        </div>
      )}
      <h1 className={styles.dayTitle}>{card.title || card.topic}</h1>

      {card.difficulty && (
        <div className={`${styles.effortBadge} ${styles.effortNormal}`}>
          ◈ {card.difficulty}{card.timeEstimate && <> · {card.timeEstimate}</>}
        </div>
      )}
      {card.snippet && <Section label="Overview"><div className={styles.practiceBox}>{card.snippet}</div></Section>}
      {hasSecContent && <ApiSecContent sec={sec} />}

      {card.core?.length > 0 && (
        <Section label="Core concepts">
          <div className={styles.topicsList}>
            {card.core.map((c, i) => <ConceptItem key={i} item={c} />)}
          </div>
        </Section>
      )}
      {card.why && <Section label="Why it matters"><div className={styles.practiceBox}>{card.why}</div></Section>}
      {card.sldsClasses && <Section label="SLDS classes"><code className={styles.inlineCode}>{card.sldsClasses}</code></Section>}
      {card.sldsCode && <Section label="Code example"><pre className={styles.codeBlock}><code>{card.sldsCode}</code></pre></Section>}
      {card.customCss && <Section label="Custom CSS"><pre className={styles.codeBlock}><code>{card.customCss}</code></pre></Section>}
      {card.cssNa && <Section label="CSS note"><div className={styles.practiceBox}>{card.cssNa}</div></Section>}
      {card.scenario && <Section label="Scenario"><div className={styles.practiceBox}>{card.scenario}</div></Section>}
      {card.notes && <Section label="Notes"><div className={styles.practiceBox}>{card.notes}</div></Section>}

      {card.deeper?.length > 0 && (
        <Section label="Go deeper">
          <div className={styles.topicsList}>
            {card.deeper.map((d, i) => (
              <div key={i} className={styles.topicItem}>
                {typeof d==="object" ? (d.title||d.definition||JSON.stringify(d)) : String(d)}
              </div>
            ))}
          </div>
        </Section>
      )}
      {card.commands?.length > 0 && (
        <Section label="Commands">
          <div className={styles.topicsList}>
            {card.commands.map((c, i) => (
              <div key={i} className={styles.topicItem}>
                <code style={{fontSize:"0.85em",whiteSpace:"pre-wrap"}}>{String(c)}</code>
              </div>
            ))}
          </div>
        </Section>
      )}
      {card.gains?.length > 0 && (
        <Section label="Skills gained">
          <div className={styles.tagsList}>
            {card.gains.map((g, i) => <span key={i} className={styles.gainTag}>{String(g)}</span>)}
          </div>
        </Section>
      )}
      {card.sources?.length > 0 && (
        <Section label="Sources & resources">
          <div className={styles.sourcesList}>
            {card.sources.map((s, i) => <SourceRow key={i} source={s} />)}
          </div>
        </Section>
      )}
    </>
  );
}

function ApiSecContent({ sec }) {
  const skip = new Set(["id","title","icon"]);
  const renderValue = (val, depth=0) => {
    if (val===null||val===undefined) return null;
    if (typeof val==="string"||typeof val==="number"||typeof val==="boolean") return <span>{String(val)}</span>;
    if (Array.isArray(val)) return (
      <ul style={{paddingLeft:depth?"1rem":0,margin:"0.25rem 0"}}>
        {val.map((item,i)=><li key={i} style={{marginBottom:"0.2rem"}}>{typeof item==="object"?renderValue(item,depth+1):String(item)}</li>)}
      </ul>
    );
    if (typeof val==="object") return (
      <div style={{paddingLeft:depth?"0.75rem":0}}>
        {Object.entries(val).map(([k,v])=>(
          <div key={k} style={{marginBottom:"0.4rem"}}>
            <strong style={{textTransform:"capitalize",opacity:0.7,fontSize:"0.8em"}}>{k.replace(/([A-Z])/g," $1").trim()}:</strong>{" "}
            {renderValue(v,depth+1)}
          </div>
        ))}
      </div>
    );
    return null;
  };
  return (
    <>
      {Object.entries(sec).filter(([k])=>!skip.has(k)).map(([key,val])=>{
        const label=key.replace(/([A-Z])/g," $1").trim();
        return (
          <Section key={key} label={label.charAt(0).toUpperCase()+label.slice(1)}>
            <div className={styles.practiceBox} style={{fontSize:"0.92em"}}>{renderValue(val)}</div>
          </Section>
        );
      })}
    </>
  );
}

/* ── ConceptItem ──
   Handles plain strings, JSON-stringified objects (old migrations that called toArray),
   and proper objects (new migrations using toRichArray).
   Used for both card.concepts (ai-journey) and card.core (tech-core-concepts). */
function ConceptItem({ item }) {
  let obj = item;
  if (typeof item === "string") {
    const t = item.trim();
    if (t.startsWith("{")) {
      try { obj = JSON.parse(t); } catch(_) {}
    }
  }

  // Plain string — just show it
  if (typeof obj !== "object" || obj === null) {
    return <div className={styles.topicItem}>{String(obj)}</div>;
  }

  // Structured object — pull the most meaningful fields first
  const label = obj.concept || obj.title || obj.aspect || obj.step || "";
  const desc  = obj.meaning || obj.definition || obj.what  || "";
  const extra = obj.example || obj.aiUse || obj.code || obj.task || obj.keyInsight || "";
  const shown = new Set(["concept","title","aspect","step","meaning","definition","what","example","aiUse","code","task","keyInsight"]);
  const others = Object.entries(obj).filter(([k]) => !shown.has(k));

  return (
    <div className={styles.topicItem} style={{flexDirection:"column",alignItems:"flex-start",gap:"3px"}}>
      {label && <strong style={{color:"var(--text)"}}>{label}</strong>}
      {desc  && <span style={{opacity:0.85,fontSize:"0.9em"}}>{desc}</span>}
      {extra && <span style={{opacity:0.7,fontSize:"0.85em",fontStyle:"italic"}}>💡 {extra}</span>}
      {others.map(([k, v]) => (
        <span key={k} style={{opacity:0.7,fontSize:"0.82em"}}>
          <strong style={{textTransform:"capitalize"}}>{k}:</strong> {String(v)}
        </span>
      ))}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

function SourceRow({ source }) {
  const badgeIcon = source.b==="trail"?"T":source.b==="tool"?"⚙":source.b==="ref"?"R":"D";
  const content = (
    <div className={styles.sourceItem}>
      <div className={styles.sourceIcon}>{badgeIcon}</div>
      <span className={styles.sourceTitle}>{source.t}</span>
      <span className={styles.sourceBadge}>{source.b||"docs"}</span>
    </div>
  );
  return source.u ? <a href={source.u} target="_blank" rel="noopener noreferrer">{content}</a> : content;
}