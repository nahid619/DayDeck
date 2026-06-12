"use client";
// components/admin/CardsManager.js
// Full CRUD for cards inside a selected phase.
// Renders dynamic form fields based on plan.cardType using CARD_FIELDS from cardSchema.

import { useState, useEffect } from "react";
import { CARD_TYPES, CARD_FIELDS } from "@/lib/cardSchema";
import useFetch    from "@/hooks/useFetch";
import useMutation from "@/hooks/useMutation";
import AdminModal  from "./AdminModal";
import SmartPaste  from "./SmartPaste";
import styles      from "./CardsManager.module.css";

export default function CardsManager({ plan, phase, onToast }) {
  const url = `/api/cards?planSlug=${plan.slug}&phase=${phase.phaseId}`;
  const { data: cards, loading, refetch } = useFetch(url);
  const { mutate, loading: saving }       = useMutation();

  const [modal,          setModal]          = useState(null);
  const [formData,       setFormData]       = useState({});
  const [error,          setError]          = useState("");
  const [showAll,        setShowAll]        = useState(false);
  const [deleteError,    setDeleteError]    = useState("");
  const [showSmartPaste, setShowSmartPaste] = useState(false);

  // Reset when phase changes
  useEffect(() => { setModal(null); setError(""); setShowAll(false); }, [phase._id]);

  const blankCard = () => ({
    planSlug: plan.slug,
    planId:   plan._id,
    cardType: plan.cardType,
    phase:    phase.phaseId,
  });

  /* ── Add ── */
  function openAdd() {
    setFormData(blankCard()); setError(""); setModal("add");
  }

  /* ── Smart Paste ── */
  function openSmartPaste() {
    setError("");
    setShowSmartPaste(true);
  }

  function handleSmartParsed(parsed) {
    // Build the full formData in one shot — no conditional spreading,
    // no truthy checks that would silently drop empty strings.
    const merged = {
      ...blankCard(),
      title:    typeof parsed.title    === "string" ? parsed.title    : "",
      badge:    typeof parsed.badge    === "string" ? parsed.badge    : "",
      color:    typeof parsed.color    === "string" ? parsed.color    : "",
      sections: Array.isArray(parsed.sections)      ? parsed.sections : [],
      // day-plan / stories may also surface a topic field
      ...(parsed.topic ? { topic: parsed.topic } : {}),
    };
    // Set formData first, then open modal — avoids any batching edge cases
    setFormData(merged);
    setError("");
    setShowSmartPaste(false);
    setModal("add");
  }

  async function handleAdd() {
    setError("");
    const result = await mutate("/api/cards", "POST", formData);
    if (!result) { setError("Failed to create card"); return; }
    refetch(); setModal(null);
    onToast("Card created");
  }

  /* ── Edit ── */
  function openEdit(card, e) {
    e.stopPropagation();
    setFormData({ ...card }); setError(""); setModal("edit");
  }

  async function handleEdit() {
    setError("");
    const result = await mutate(`/api/cards/${formData._id}`, "PUT", formData);
    if (!result) { setError("Failed to update card"); return; }
    refetch(); setModal(null);
    onToast("Card updated");
  }

  /* ── Delete ── */
  function openDelete(card, e) {
    e.stopPropagation();
    setFormData(card); setDeleteError(""); setModal("delete");
  }

  async function handleDelete() {
    setDeleteError("");
    const res = await mutate(`/api/cards/${formData._id}`, "DELETE");
    if (!res) { setDeleteError("Failed to delete card — try again"); return; }
    refetch(); setModal(null);
    onToast("Card deleted", "error");
  }

  function cardSummary(card) {
    if (plan.cardType === CARD_TYPES.DAY_PLAN)  return `Day ${card.day || card.order} — ${card.topic || ""}`;
    if (plan.cardType === CARD_TYPES.STORIES)   return `#${card.storyId} — ${card.title || ""}`;
    if (plan.cardType === CARD_TYPES.FLEX)       return card.title || `Flex card #${card.order}`;
    return card.title || card.topic || `Entry #${card.order}`;
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.panelHdr}>
        <div className={styles.hdrLeft}>
          <span className={styles.phaseId}>{phase.phaseId}</span>
          <span className={styles.phaseLabel}>{phase.label}</span>
          <span className={styles.cardCount}>{(cards || []).length} cards</span>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ Card</button>
        <button className={styles.smartBtn} onClick={openSmartPaste}>✦ Smart Paste</button>
      </div>

      {/* Cards list */}
      <div className={styles.cardsList}>
        {loading && <div className={styles.loading}>Loading…</div>}
        {!loading && (!cards || cards.length === 0) && (
          <div className={styles.empty}>
            No cards in this phase yet. Add the first one!
          </div>
        )}
        {(cards || []).map(card => (
          <div key={card._id} className={styles.cardItem}>
            <div className={styles.cardLeft}>
              <span className={styles.cardOrder}>
                {plan.cardType === CARD_TYPES.DAY_PLAN  && (card.day || card.order)}
                {plan.cardType === CARD_TYPES.STORIES   && `#${card.storyId || card.order}`}
                {plan.cardType === CARD_TYPES.REFERENCE && (card.modNum || card.order || "—")}
                {plan.cardType === CARD_TYPES.FLEX       && (card.badge || `Q${card.order ?? 1}`)}
              </span>
              <div className={styles.cardInfo}>
                <span className={styles.cardTitle}>{cardSummary(card)}</span>
                {plan.cardType === CARD_TYPES.DAY_PLAN && card.effort && (
                  <span className={`${styles.effortBadge} ${styles[`effort_${card.effort}`]}`}>
                    {card.effort}
                  </span>
                )}
                {plan.cardType === CARD_TYPES.STORIES && card.sectionTitle && (
                  <span className={styles.sectionBadge}>{card.sectionTitle}</span>
                )}
              </div>
            </div>
            <div className={styles.cardActions}>
              <button className={styles.iconBtn} onClick={e => openEdit(card, e)} title="Edit">✎</button>
              <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={e => openDelete(card, e)} title="Delete">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      <AdminModal
        open={modal === "add" || modal === "edit"}
        title={modal === "add" ? `Add Card — ${phase.label}` : "Edit Card"}
        onClose={() => setModal(null)}
        onConfirm={modal === "add" ? handleAdd : handleEdit}
        confirmLabel={modal === "add" ? "Create Card" : "Save Changes"}
        loading={saving} error={error}
      >
        <CardForm
          showAll={showAll}
          onToggleShowAll={() => setShowAll(s => !s)}
          data={formData}
          onChange={setFormData}
          cardType={plan.cardType}
        />
      </AdminModal>

      {/* Delete confirm */}
      <AdminModal
        open={modal === "delete"}
        title="Delete Card"
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete"
        confirmDanger loading={saving}
        error={deleteError}
      >
        <p className={styles.deleteWarning}>
          Delete <strong>{cardSummary(formData)}</strong>? This cannot be undone.
        </p>
      </AdminModal>

      {/* Smart Paste — paste raw text, AI parses → opens Add Card pre-filled */}
      {showSmartPaste && (
        <SmartPaste
          cardType={plan.cardType}
          onParsed={handleSmartParsed}
          onClose={() => setShowSmartPaste(false)}
        />
      )}
    </div>
  );
}

/* ── Dynamic card form ───────────────────────────────── */
function CardForm({ data, onChange, cardType, showAll, onToggleShowAll }) {
  const fields = CARD_FIELDS[cardType] || [];
  const set     = (k, v) => onChange(p => ({ ...p, [k]: v }));

  const hiddenCount = fields.filter(f =>
    f.optional && !showAll && !data[f.key] && data[f.key] !== 0
  ).length;

  return (
    <div className={styles.cardForm}>
      {fields.map(field => {
        if (field.optional && !showAll && !data[field.key] && data[field.key] !== 0) {
          return null;
        }
        return (
          <CardField
            key={field.key}
            field={field}
            value={data[field.key]}
            onChange={v => set(field.key, v)}
          />
        );
      })}
      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.showAllBtn}
          onClick={onToggleShowAll}
        >
          + Show {hiddenCount} optional field{hiddenCount !== 1 ? "s" : ""}
        </button>
      )}
      {showAll && hiddenCount === 0 && (
        <button
          type="button"
          className={styles.showAllBtn}
          onClick={onToggleShowAll}
        >
          − Hide optional fields
        </button>
      )}
    </div>
  );
}

function CardField({ field, value, onChange }) {
  const { key, label, type, hint, options, required } = field;

  const labelEl = (
    <label className={styles.fieldLabel}>
      {label}{required && <span className={styles.req}> *</span>}
      {hint && <span className={styles.fieldHint}> — {hint}</span>}
    </label>
  );

  if (type === "text") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <input className={styles.input} value={value || ""}
        onChange={e => onChange(e.target.value)} />
    </div>
  );

  if (type === "number") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <input className={styles.input} type="number" value={value || ""}
        onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
    </div>
  );

  if (type === "textarea") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <textarea className={styles.textarea} rows={3} value={value || ""}
        onChange={e => onChange(e.target.value)} />
    </div>
  );

  if (type === "select") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <select className={styles.input} value={value || ""}
        onChange={e => onChange(e.target.value)}>
        <option value="">— select —</option>
        {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  if (type === "tags") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <TagsInput value={Array.isArray(value) ? value : []} onChange={onChange} />
    </div>
  );

  if (type === "sources") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <SourcesInput value={Array.isArray(value) ? value : []} onChange={onChange} />
    </div>
  );

  if (type === "flex-sections") return (
    <div className={styles.fieldRow}>
      {labelEl}
      <FlexSectionsInput value={Array.isArray(value) ? value : []} onChange={onChange} />
    </div>
  );

  return null;
}

/* ── Tags input — dynamic array of strings ── */
function TagsInput({ value, onChange }) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  function remove(i) { onChange(value.filter((_, idx) => idx !== i)); }

  return (
    <div className={styles.tagsWrap}>
      <div className={styles.tagsList}>
        {value.map((tag, i) => (
          <span key={i} className={styles.tag}>
            {tag}
            <button className={styles.tagRemove} onClick={() => remove(i)}>×</button>
          </span>
        ))}
      </div>
      <div className={styles.tagInputRow}>
        <input
          className={styles.input}
          value={draft}
          placeholder="Type and press Enter or Add"
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button className={styles.tagAddBtn} onClick={add}>Add</button>
      </div>
    </div>
  );
}


/* ── Flex Sections input — dynamic array of {label, type, content} ── */
function FlexSectionsInput({ value, onChange }) {
  const BLANK = { label: "", type: "text", content: "" };

  function addSection()       { onChange([...value, { ...BLANK }]); }
  function removeSection(i)   { onChange(value.filter((_, idx) => idx !== i)); }
  function moveUp(i)          { if (i === 0) return; const n=[...value]; [n[i-1],n[i]]=[n[i],n[i-1]]; onChange(n); }
  function moveDown(i)        { if (i === value.length-1) return; const n=[...value]; [n[i],n[i+1]]=[n[i+1],n[i]]; onChange(n); }
  function update(i, k, v)    { const n=[...value]; n[i]={...n[i],[k]:v}; onChange(n); }

  const typeHints = {
    text: "Free paragraph. Newlines are preserved.",
    list: "One item per line — renders as a numbered list.",
    code: "Monospace code block — paste code or commands here.",
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"10px",width:"100%"}}>
      {value.map((sec, i) => (
        <div key={i} style={{
          border:"1px solid var(--border)",borderRadius:"6px",
          padding:"10px 12px",display:"flex",flexDirection:"column",gap:"6px",
          background:"var(--surf2)"
        }}>
          <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
            <input
              className={styles.input}
              value={sec.label || ""}
              onChange={e => update(i,"label",e.target.value)}
              placeholder="Section label (e.g. Algorithm, Problem, What to learn)"
              style={{flex:1}}
            />
            <select
              className={styles.input}
              value={sec.type || "text"}
              onChange={e => update(i,"type",e.target.value)}
              style={{width:"90px",flexShrink:0}}
              title={typeHints[sec.type || "text"]}
            >
              <option value="text">text</option>
              <option value="list">list</option>
              <option value="code">code</option>
            </select>
            <button className={styles.iconBtn} onClick={() => moveUp(i)}   title="Move up">↑</button>
            <button className={styles.iconBtn} onClick={() => moveDown(i)} title="Move down">↓</button>
            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => removeSection(i)} title="Remove">✕</button>
          </div>
          <div style={{fontSize:"0.75em",opacity:0.55,paddingLeft:"2px"}}>
            {typeHints[sec.type || "text"]}
          </div>
          <textarea
            className={styles.textarea}
            rows={sec.type === "code" ? 5 : 3}
            value={sec.content || ""}
            onChange={e => update(i,"content",e.target.value)}
            placeholder={
              sec.type === "list" ? "First item\nSecond item\nThird item" :
              sec.type === "code" ? "paste code here..." :
              "Section content..."
            }
            style={sec.type === "code" ? {fontFamily:"monospace",fontSize:"0.85em"} : {}}
          />
        </div>
      ))}
      <button className={styles.srcAddBtn} onClick={addSection}>+ Add Section</button>
    </div>
  );
}
/* ── Sources input — dynamic array of {t, u, b} objects ── */
function SourcesInput({ value, onChange }) {
  const BLANK_SRC = { t:"", u:"", b:"docs" };

  function addSrc() { onChange([...value, { ...BLANK_SRC }]); }
  function removeSrc(i) { onChange(value.filter((_, idx) => idx !== i)); }
  function updateSrc(i, k, v) {
    const next = [...value];
    next[i] = { ...next[i], [k]: v };
    onChange(next);
  }

  return (
    <div className={styles.sourcesWrap}>
      {value.map((src, i) => (
        <div key={i} className={styles.sourceRow}>
          <input className={styles.input} value={src.t || ""}
            onChange={e => updateSrc(i, "t", e.target.value)}
            placeholder="Title" style={{flex:2}} />
          <input className={styles.input} value={src.u || ""}
            onChange={e => updateSrc(i, "u", e.target.value)}
            placeholder="URL (optional)" style={{flex:3}} />
          <select className={styles.input} value={src.b || "docs"}
            onChange={e => updateSrc(i, "b", e.target.value)} style={{flex:1}}>
            <option value="docs">docs</option>
            <option value="trail">trail</option>
            <option value="tool">tool</option>
            <option value="ref">ref</option>
            <option value="video">video</option>
          </select>
          <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => removeSrc(i)}>✕</button>
        </div>
      ))}
      <button className={styles.srcAddBtn} onClick={addSrc}>+ Add Source</button>
    </div>
  );
}
