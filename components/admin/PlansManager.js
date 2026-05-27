"use client";
// components/admin/PlansManager.js
// Issues fixed: #13 hover-only delete, #14 error in delete modal.

import { useState, useRef } from "react";
import { CARD_TYPES } from "@/lib/cardSchema";
import useMutation from "@/hooks/useMutation";
import AdminModal  from "./AdminModal";
import styles      from "./PlansManager.module.css";

const CARD_TYPE_OPTIONS = [
  { value: CARD_TYPES.DAY_PLAN,  label: "Day Plan (day-by-day schedule)" },
  { value: CARD_TYPES.STORIES,   label: "Stories (user story format)" },
  { value: CARD_TYPES.REFERENCE, label: "Reference (docs / SLDS style)" },
  { value: CARD_TYPES.FLEX,      label: "Flex (custom freeform sections)" },
];

const BLANK_PLAN = {
  slug:"", title:"", fullTitle:"", emoji:"📚", color:"#60A5FA",
  tabLabel:"", cardType: CARD_TYPES.DAY_PLAN, description:"", eyebrow:"",
};

export default function PlansManager({ plans, setPlans, selectedPlan, onSelectPlan, onToast }) {
  const { mutate, loading } = useMutation();
  const [modal,    setModal]    = useState(null);
  const [formData, setFormData] = useState(BLANK_PLAN);
  const [error,    setError]    = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDirty,  setIsDirty]  = useState(false);

  const dragIdx   = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  function markDirty() { setIsDirty(true); }

  function onDragStart(i) { dragIdx.current = i; }
  function onDragEnter(i) { setDragOver(i); }
  function onDragEnd()    { setDragOver(null); dragIdx.current = null; }

  async function onDrop(dropIdx) {
    setDragOver(null);
    const fromIdx = dragIdx.current;
    if (fromIdx === null || fromIdx === dropIdx) return;
    const reordered = [...plans];
    const [moved]   = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    const withOrder = reordered.map((p, i) => ({ ...p, order: i + 1 }));
    setPlans(withOrder);
    await Promise.all(
      withOrder.map((p, i) =>
        plans[i]?._id !== p._id || plans[i]?.order !== p.order
          ? mutate(`/api/plans/${p._id}`, "PUT", { order: i + 1 })
          : Promise.resolve()
      )
    );
    onToast("Tab order updated");
  }

  function openAdd() {
    setFormData(BLANK_PLAN); setError(""); setIsDirty(false); setModal("add");
  }

  async function handleAdd() {
    setError("");
    if (!formData.slug || !formData.title || !formData.cardType) {
      setError("Slug, title and card type are required"); return;
    }
    const payload = {
      ...formData,
      tabLabel:  formData.tabLabel  || `${formData.emoji} ${formData.title}`,
      fullTitle: formData.fullTitle || formData.title,
    };
    const created = await mutate("/api/plans", "POST", payload);
    if (!created) { setError("Failed to create plan"); return; }
    setPlans(prev => [...prev, created]);
    setModal(null);
    onToast(`Plan "${created.title}" created`);
  }

  function openEdit(plan, e) {
    e.stopPropagation();
    setFormData({ ...plan }); setError(""); setIsDirty(false); setModal("edit");
  }

  async function handleEdit() {
    setError("");
    const updated = await mutate(`/api/plans/${formData._id}`, "PUT", formData);
    if (!updated) { setError("Failed to update plan"); return; }
    setPlans(prev => prev.map(p => p._id === updated._id ? updated : p));
    if (selectedPlan?._id === updated._id) onSelectPlan(updated);
    setModal(null);
    onToast(`Plan "${updated.title}" updated`);
  }

  function openDelete(plan, e) {
    e.stopPropagation();
    setFormData(plan); setDeleteError(""); setModal("delete");
  }

  async function handleDelete() {
    setDeleteError("");
    const res = await mutate(`/api/plans/${formData._id}`, "DELETE");
    if (!res) { setDeleteError("Failed to delete plan — try again"); return; }
    setPlans(prev => prev.filter(p => p._id !== formData._id));
    if (selectedPlan?._id === formData._id) onSelectPlan(null);
    setModal(null);
    onToast(`Plan "${formData.title}" deleted`, "error");
  }

  function handleTitleChange(val) {
    const auto = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setFormData(p => ({
      ...p,
      title: val,
      slug:  p.slug === "" || p.slug === auto.slice(0,-1) ? auto : p.slug,
      tabLabel: p.tabLabel === "" || p.tabLabel === p.title ? `${p.emoji} ${val}` : p.tabLabel,
    }));
    markDirty();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panelHdr}>
        <span className={styles.panelTitle}>Plans</span>
        <span className={styles.hdrHint}>Tab order = drag order</span>
        <button className={styles.addBtn} onClick={openAdd}>+ Add</button>
      </div>

      <div className={styles.list}>
        {plans.map((plan, i) => (
          <div
            key={plan._id}
            className={`${styles.planItem} ${selectedPlan?._id === plan._id ? styles.planActive : ""} ${dragOver === i ? styles.dragOver : ""}`}
            onClick={() => onSelectPlan(plan)}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragOver={e => e.preventDefault()}
            onDragEnd={onDragEnd}
            onDrop={() => onDrop(i)}
          >
            <span className={styles.dragHandle}>⠿</span>
            <span className={styles.planEmoji}>{plan.emoji}</span>
            <div className={styles.planInfo}>
              <span className={styles.planTitle}>{plan.title}</span>
              <span className={styles.planMeta}>
                <span className={styles.cardTypeBadge}>{plan.cardType}</span>
                <span>{plan.totalCards || 0} cards</span>
              </span>
            </div>
            {/* Actions: hidden by default, revealed on hover (#13) */}
            <div className={styles.planActions}>
              <button className={styles.iconBtn} onClick={e => openEdit(plan, e)} title="Edit">✎</button>
              <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={e => openDelete(plan, e)} title="Delete">✕</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className={styles.empty}>No plans yet. Add your first one!</div>}
      </div>

      <AdminModal
        open={modal === "add" || modal === "edit"}
        title={modal === "add" ? "Add New Plan" : "Edit Plan"}
        onClose={() => setModal(null)}
        onConfirm={modal === "add" ? handleAdd : handleEdit}
        confirmLabel={modal === "add" ? "Create Plan" : "Save Changes"}
        loading={loading} error={error} isDirty={isDirty}
      >
        <PlanForm
          data={formData}
          onChange={(val) => { setFormData(val); markDirty(); }}
          onTitleChange={handleTitleChange}
          isEdit={modal === "edit"}
        />
      </AdminModal>

      {/* Delete modal — now shows error (#14) */}
      <AdminModal
        open={modal === "delete"}
        title="Delete Plan"
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete Plan"
        confirmDanger loading={loading}
        error={deleteError}
      >
        <p className={styles.deleteWarning}>
          This will permanently delete <strong>{formData.title}</strong> and all its phases and cards. This cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}

function PlanForm({ data, onChange, onTitleChange, isEdit }) {
  const set = (k, v) => onChange(p => ({ ...p, [k]: v }));
  return (
    <div className={styles.form}>
      <Row label="Title *">
        <input className={styles.input} value={data.title}
          onChange={e => onTitleChange(e.target.value)} placeholder="e.g. C++ 30-Day" />
      </Row>
      <Row label="Slug *" hint="URL-safe, no spaces">
        <input className={styles.input} value={data.slug}
          onChange={e => set("slug", e.target.value)} placeholder="e.g. cpp-30day"
          disabled={isEdit} style={isEdit ? { opacity:.5 } : {}} />
      </Row>
      <Row label="Card Type *">
        <select className={styles.input} value={data.cardType}
          onChange={e => set("cardType", e.target.value)} disabled={isEdit}
          style={isEdit ? { opacity:.5 } : {}}>
          {[
            { value: "day-plan",  label: "Day Plan" },
            { value: "stories",   label: "Stories" },
            { value: "reference", label: "Reference" },
            { value: "flex",      label: "Flex (custom sections)" },
          ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Row>
      <TwoCol>
        <Row label="Emoji">
          <input className={styles.input} value={data.emoji}
            onChange={e => set("emoji", e.target.value)} placeholder="📚" />
        </Row>
        <Row label="Accent Color">
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input type="color" value={data.color} onChange={e => set("color", e.target.value)}
              style={{width:36,height:34,padding:2,background:"none",border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer"}} />
            <input className={styles.input} value={data.color}
              onChange={e => set("color", e.target.value)} placeholder="#60A5FA" style={{flex:1}} />
          </div>
        </Row>
      </TwoCol>
      <Row label="Tab Label" hint="Shown in the top nav tab">
        <input className={styles.input} value={data.tabLabel}
          onChange={e => set("tabLabel", e.target.value)} placeholder={`${data.emoji} ${data.title}`} />
      </Row>
      <Row label="Full Title">
        <input className={styles.input} value={data.fullTitle}
          onChange={e => set("fullTitle", e.target.value)} placeholder="Full descriptive title" />
      </Row>
      <Row label="Description">
        <textarea className={styles.textarea} rows={2} value={data.description}
          onChange={e => set("description", e.target.value)} placeholder="Short description" />
      </Row>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>{label}{hint && <span className={styles.fieldHint}> — {hint}</span>}</label>
      {children}
    </div>
  );
}
function TwoCol({ children }) { return <div className={styles.twoCol}>{children}</div>; }
