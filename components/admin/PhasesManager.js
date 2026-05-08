"use client";
// components/admin/PhasesManager.js
// Issues fixed: #13 hover-only delete, #14 error in delete modal, #20 drag-to-reorder.

import { useState, useEffect, useRef } from "react";
import useFetch    from "@/hooks/useFetch";
import useMutation from "@/hooks/useMutation";
import AdminModal  from "./AdminModal";
import styles      from "./PhasesManager.module.css";

const BLANK = { phaseId:"", label:"", title:"", meta:"", weekGoal:"" };

export default function PhasesManager({ plan, selectedPhase, onSelectPhase, onPlanUpdated, onToast }) {
  const { data: phases, loading, refetch } = useFetch(`/api/phases?planSlug=${plan.slug}`);
  const { mutate, loading: saving }        = useMutation();
  const [modal,       setModal]       = useState(null);
  const [formData,    setFormData]    = useState(BLANK);
  const [error,       setError]       = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDirty,     setIsDirty]     = useState(false);

  // Drag-to-reorder state (#20)
  const dragIdx   = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => { setModal(null); }, [plan.slug]);

  const set = (k, v) => { setFormData(p => ({ ...p, [k]: v })); setIsDirty(true); };

  /* ── Drag (#20) ── */
  function onDragStart(i) { dragIdx.current = i; }
  function onDragEnter(i) { setDragOver(i); }
  function onDragEnd()    { setDragOver(null); dragIdx.current = null; }

  async function onDrop(dropIdx) {
    setDragOver(null);
    const fromIdx = dragIdx.current;
    if (fromIdx === null || fromIdx === dropIdx || !phases) return;
    const reordered = [...phases];
    const [moved]   = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    await Promise.all(
      reordered.map((p, i) =>
        mutate(`/api/phases/${p._id}`, "PUT", { order: i + 1 })
      )
    );
    refetch();
    onToast("Phase order updated");
  }

  /* ── Add ── */
  function openAdd() {
    setFormData({ ...BLANK, planSlug: plan.slug, planId: plan._id });
    setError(""); setIsDirty(false); setModal("add");
  }
  async function handleAdd() {
    setError("");
    if (!formData.phaseId || !formData.label) { setError("Phase ID and label are required"); return; }
    const created = await mutate("/api/phases", "POST", { ...formData, planSlug: plan.slug, planId: plan._id });
    if (!created) { setError("Failed to create phase"); return; }
    refetch(); setModal(null);
    onToast(`Phase "${created.label}" created`);
  }

  /* ── Edit ── */
  function openEdit(phase, e) {
    e.stopPropagation();
    setFormData({ ...phase }); setError(""); setIsDirty(false); setModal("edit");
  }
  async function handleEdit() {
    setError("");
    const updated = await mutate(`/api/phases/${formData._id}`, "PUT", formData);
    if (!updated) { setError("Failed to update phase"); return; }
    refetch();
    if (selectedPhase?._id === updated._id) onSelectPhase(updated);
    setModal(null);
    onToast(`Phase "${updated.label}" updated`);
  }

  /* ── Delete ── */
  function openDelete(phase, e) {
    e.stopPropagation();
    setFormData(phase); setDeleteError(""); setModal("delete");
  }
  async function handleDelete() {
    setDeleteError("");
    const res = await mutate(`/api/phases/${formData._id}`, "DELETE");
    if (!res) { setDeleteError("Failed to delete phase — try again"); return; }
    refetch();
    if (selectedPhase?._id === formData._id) onSelectPhase(null);
    setModal(null);
    onToast(`Phase "${formData.label}" deleted`, "error");
  }

  function handleLabelChange(val) {
    const auto = val.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
    setFormData(p => ({ ...p, label: val, phaseId: p.phaseId === "" ? auto : p.phaseId }));
    setIsDirty(true);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panelHdr}>
        <div className={styles.hdrLeft}>
          <span className={styles.planEmoji}>{plan.emoji}</span>
          <span className={styles.panelTitle}>{plan.title}</span>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ Phase</button>
      </div>

      <div className={styles.subHint}>
        {plan.cardType === "day-plan"  && "Phases = Weeks / Modules · drag to reorder"}
        {plan.cardType === "stories"   && "Phases = Parts / Sections · drag to reorder"}
        {plan.cardType === "reference" && "Phases = Chapters / Modules · drag to reorder"}
      </div>

      <div className={styles.list}>
        {loading && <div className={styles.loading}>Loading…</div>}
        {!loading && (!phases || phases.length === 0) && (
          <div className={styles.empty}>No phases yet. Add the first one!</div>
        )}
        {(phases || []).map((phase, i) => (
          <div
            key={phase._id}
            className={`${styles.phaseItem} ${selectedPhase?._id === phase._id ? styles.phaseActive : ""} ${dragOver === i ? styles.dragOver : ""}`}
            onClick={() => onSelectPhase(phase)}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragOver={e => e.preventDefault()}
            onDragEnd={onDragEnd}
            onDrop={() => onDrop(i)}
          >
            <span className={styles.dragHandle}>⠿</span>
            <div className={styles.phaseLeft}>
              <span className={styles.phaseId}>{phase.phaseId}</span>
              <div className={styles.phaseInfo}>
                <span className={styles.phaseLabel}>{phase.label}</span>
                {phase.title && <span className={styles.phaseTitle}>{phase.title}</span>}
              </div>
            </div>
            <div className={styles.phaseActions}>
              <button className={styles.iconBtn} onClick={e => openEdit(phase, e)} title="Edit">✎</button>
              <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={e => openDelete(phase, e)} title="Delete">✕</button>
            </div>
          </div>
        ))}
      </div>

      <AdminModal
        open={modal === "add" || modal === "edit"}
        title={modal === "add" ? `Add Phase to ${plan.title}` : "Edit Phase"}
        onClose={() => setModal(null)}
        onConfirm={modal === "add" ? handleAdd : handleEdit}
        confirmLabel={modal === "add" ? "Create Phase" : "Save Changes"}
        loading={saving} error={error} isDirty={isDirty}
      >
        <div className={styles.form}>
          <Field label="Label *" hint="Shown in sidebar e.g. Week 1, S1, Module 1">
            <input className={styles.input} value={formData.label}
              onChange={e => handleLabelChange(e.target.value)} placeholder="Week 1" />
          </Field>
          <Field label="Phase ID *" hint="Short internal key e.g. w1, s1, m1">
            <input className={styles.input} value={formData.phaseId}
              onChange={e => set("phaseId", e.target.value)} placeholder="w1"
              disabled={modal === "edit"} style={modal === "edit" ? {opacity:.5} : {}} />
          </Field>
          <Field label="Title" hint="Longer title e.g. Foundations">
            <input className={styles.input} value={formData.title || ""}
              onChange={e => set("title", e.target.value)} placeholder="Foundations" />
          </Field>
          <Field label="Meta" hint="e.g. Days 1–5, 5 Lessons">
            <input className={styles.input} value={formData.meta || ""}
              onChange={e => set("meta", e.target.value)} placeholder="Days 1–7" />
          </Field>
          <Field label="Week Goal" hint="One-line goal shown in the plan">
            <input className={styles.input} value={formData.weekGoal || ""}
              onChange={e => set("weekGoal", e.target.value)}
              placeholder="Set up your dev environment" />
          </Field>
        </div>
      </AdminModal>

      {/* Delete — now shows error (#14) */}
      <AdminModal
        open={modal === "delete"}
        title="Delete Phase"
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete Phase"
        confirmDanger loading={saving}
        error={deleteError}
      >
        <p className={styles.deleteWarning}>
          Delete <strong>{formData.label}</strong>? All cards in this phase will also be permanently deleted.
        </p>
      </AdminModal>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>
        {label}{hint && <span className={styles.fieldHint}> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}
