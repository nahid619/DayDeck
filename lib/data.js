// lib/data.js
// Server-side data fetchers used by Server Components.
// All use force-dynamic via the page exports — no caching.

import { getDb } from "./mongodb.js";
import { ObjectId } from "mongodb";

// ── Plans ─────────────────────────────────────────────────────────────

/** Get all plans ordered by their display order */
export async function getPlans() {
  const db = await getDb();
  return db.collection("plans").find({}).sort({ order: 1 }).toArray();
}

/** Get a single plan by slug */
export async function getPlanBySlug(slug) {
  const db = await getDb();
  return db.collection("plans").findOne({ slug });
}

// ── Phases ────────────────────────────────────────────────────────────

/** Get all phases for a plan, ordered */
export async function getPhasesByPlan(planSlug) {
  const db = await getDb();
  return db
    .collection("phases")
    .find({ planSlug })
    .sort({ order: 1 })
    .toArray();
}

// ── Cards ─────────────────────────────────────────────────────────────

/** Get all cards for a plan, optionally filtered by phase */
export async function getCardsByPlan(planSlug, phase = null) {
  const db    = await getDb();
  const query = { planSlug };
  if (phase) query.phase = phase;
  return db.collection("cards").find(query).sort({ order: 1 }).toArray();
}
