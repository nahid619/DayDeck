"use client";
// components/admin/SmartPaste.js
// "Smart Entry" — two modes in one modal:
//   JSON mode  → user pastes a card JSON object → parsed instantly, no AI needed
//   Text mode  → user pastes raw text → Gemini extracts the fields → card form
// Either path ends with the Add Card modal opening pre-filled and fully editable.

import { useState } from "react";
import styles from "./SmartPaste.module.css";

const JSON_PLACEHOLDER = `Paste a card JSON object here, e.g.:

{
  "title": "Check if a Number is a Fibonacci Number",
  "badge": "Q5",
  "color": "",
  "sections": [
    { "label": "Problem",   "type": "text", "content": "..." },
    { "label": "Algorithm", "type": "text", "content": "..." },
    { "label": "Example",   "type": "code", "content": "..." }
  ]
}`;

const TEXT_PLACEHOLDER = `Paste your raw card content here — any format works.

Q5 — Check if a Number is a Fibonacci Number
Problem: Take a number. Print whether it belongs to the Fibonacci series.
Algorithm: A number n is Fibonacci if (5n²+4) or (5n²-4) is a perfect square.
* int(x**0.5)**2 == x  → checks for a perfect square
Example:
  Input: 21
  Output: 21 is a Fibonacci number`;

export default function SmartPaste({ cardType = "flex", onParsed, onClose }) {
  const [mode,    setMode]    = useState(null);   // null | "json" | "text"
  const [raw,     setRaw]     = useState("");
  const [parsing, setParsing] = useState(false);
  const [error,   setError]   = useState("");

  function switchMode(next) {
    setMode(next);
    setRaw("");
    setError("");
  }

  // ── JSON mode ─────────────────────────────────────────────────────────────
  function handleJSON() {
    setError("");
    let parsed;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      setError("Invalid JSON. Check for missing commas, brackets, or quotes.");
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      setError("Paste a JSON object, not an array or primitive.");
      return;
    }
    onParsed({
      title:    typeof parsed.title    === "string" ? parsed.title    : "",
      badge:    typeof parsed.badge    === "string" ? parsed.badge    : "",
      color:    "",
      sections: Array.isArray(parsed.sections)      ? parsed.sections : [],
      ...(parsed.topic ? { topic: parsed.topic } : {}),
    });
    onClose();
  }

  // ── Text / AI mode ────────────────────────────────────────────────────────
  async function handleText() {
    const text = raw.trim();
    if (!text) { setError("Paste some content first."); return; }
    setError("");
    setParsing(true);
    try {
      const res  = await fetch("/api/parse-card", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, cardType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
      onParsed(json);
      onClose();
    } catch (e) {
      setError("Parse failed: " + (e.message || "unknown error"));
      setParsing(false);
    }
  }

  function handleKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (mode === "json")  handleJSON();
      if (mode === "text")  handleText();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Smart Entry"
      >
        {/* Header */}
        <div className={styles.hdr}>
          <div className={styles.hdrLeft}>
            <span className={styles.sparkIcon} aria-hidden="true">✦</span>
            <div>
              <h2 className={styles.title}>Smart Entry</h2>
              <p className={styles.sub}>
                {!mode && "Choose how you want to add your card data"}
                {mode === "json" && "Paste a JSON object — imported instantly"}
                {mode === "text" && "Paste raw text — AI extracts the card fields"}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Mode selector — always visible */}
          <div className={styles.modeRow}>
            <button
              className={`${styles.modeBtn} ${mode === "json" ? styles.modeBtnActive : ""}`}
              onClick={() => switchMode("json")}
            >
              <span className={styles.modeIcon}>{ "{ }" }</span>
              <span className={styles.modeLabel}>Paste JSON</span>
              <span className={styles.modeSub}>Direct import, no AI</span>
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "text" ? styles.modeBtnActive : ""}`}
              onClick={() => switchMode("text")}
            >
              <span className={styles.modeIcon}>✦</span>
              <span className={styles.modeLabel}>Paste Text</span>
              <span className={styles.modeSub}>AI extracts the fields</span>
            </button>
          </div>

          {/* Input area — only shown once a mode is selected */}
          {mode && (
            <>
              <textarea
                className={styles.rawInput}
                value={raw}
                onChange={e => { setRaw(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                placeholder={mode === "json" ? JSON_PLACEHOLDER : TEXT_PLACEHOLDER}
                spellCheck={false}
                autoFocus
                style={mode === "json" ? { fontFamily: "monospace", fontSize: "12px" } : {}}
              />
              {error && (
                <div className={styles.errorBox} role="alert">
                  <span aria-hidden="true">⚠</span> {error}
                </div>
              )}
              <div className={styles.hint}>
                <span className={styles.hintKbd}>Ctrl+Enter</span> to{" "}
                {mode === "json" ? "import" : "parse"}.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {mode && (
            <button
              className={styles.cancelBtn}
              onClick={() => switchMode(null)}
              disabled={parsing}
            >
              ← Back
            </button>
          )}
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={parsing}
          >
            Cancel
          </button>

          {mode === "json" && (
            <button
              className={styles.parseBtn}
              onClick={handleJSON}
              disabled={!raw.trim()}
            >
              {"{ }"} Import JSON
            </button>
          )}

          {mode === "text" && (
            <button
              className={styles.parseBtn}
              onClick={handleText}
              disabled={parsing || !raw.trim()}
            >
              {parsing
                ? <><span className={styles.spinner} aria-hidden="true" /> Parsing…</>
                : <><span aria-hidden="true">✦</span> Parse &amp; Fill Card</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}