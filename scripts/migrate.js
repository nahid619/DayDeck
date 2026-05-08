// scripts/migrate.js
//
// Reads every HTML file from ./migration-source/
// Parses plans, phases, and day cards out of the data-* attributes
// Drops and re-seeds the daydeck MongoDB database
//
// Usage:
//   npm run migrate
//   (or: node --env-file=.env.local scripts/migrate.js)
//
// Make sure .env.local has MONGODB_URI set before running.

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { MongoClient } from "mongodb";
import { PLAN_REGISTRY, CARD_TYPES } from "../lib/cardSchema.js";

// ─────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────
const SOURCE_DIR = join(process.cwd(), "migration-source");
const DB_NAME    = "daydeck";

// ─────────────────────────────────────────────────────────
// HTML PARSING UTILITIES
// ─────────────────────────────────────────────────────────

/** Decode HTML entities in a string */
/**
 * Decode HTML entities in a string.
 * &amp; MUST be first — handles double-encoded entities like
 * &amp;#39; → &#39; → ' and &amp;quot; → &quot; → "
 * Also handles hex entities like &#x2014; (em dash)
 */
function decodeEntities(str) {
  if (!str) return "";
  return String(str)
    .replace(/&amp;/g,  "&")   // FIRST — unlocks double-encoded entities
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&apos;/g, "'");
}

/**
 * Parse an attribute value:
 *  1. Decode HTML entities first (&quot; → " makes JSON valid)
 *  2. If result looks like JSON, parse it
 *  3. Otherwise return decoded string
 */
function parseAttrValue(raw) {
  const decoded = decodeEntities(raw.trim());
  const s       = decoded.trim();
  if (s.startsWith("[") || s.startsWith("{") || s.startsWith('"')) {
    try { return JSON.parse(s); } catch (_) { /* fall through */ }
  }
  return s;
}

/**
 * Find the character index of the closing > of an HTML opening tag,
 * correctly skipping > characters inside quoted attribute values.
 */
function findTagClose(html, fromIndex) {
  let inSingle = false;
  let inDouble = false;
  for (let i = fromIndex; i < html.length; i++) {
    const ch = html[i];
    if (ch === "'"  && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === '"'  && !inSingle) { inDouble = !inDouble; continue; }
    if (ch === ">"  && !inSingle && !inDouble) return i;
  }
  return -1;
}

/**
 * Extract all data-* attributes from a single opening tag string.
 * Returns a plain object { key: parsedValue }.
 *
 * For JSON array/object values: uses bracket-depth scanning that is
 * aware of JSON string delimiters (both literal " and &quot; entities).
 * This correctly handles apostrophes inside JSON strings (e.g. "don't")
 * that would otherwise prematurely close a single-quoted attribute.
 *
 * For plain string values: scans for the matching closing quote normally.
 */
function extractDataAttrs(tag) {
  const result = {};
  let i = 0;

  while (i < tag.length) {
    const di = tag.indexOf("data-", i);
    if (di === -1) break;

    const eq = tag.indexOf("=", di);
    if (eq === -1) break;
    const key    = tag.slice(di + 5, eq).trim();
    const openQ  = tag[eq + 1];
    if (openQ !== '"' && openQ !== "'") { i = eq + 1; continue; }

    const vStart = eq + 2;

    // Peek at the first non-whitespace character of the value
    let peekIdx  = vStart;
    while (peekIdx < tag.length && tag[peekIdx] === " ") peekIdx++;
    const firstCh = tag[peekIdx] || "";

    let raw, nextI;

    if (firstCh === "[" || firstCh === "{") {
      // ── JSON value ─────────────────────────────────────────────────
      // Scan bracket depth, treating both literal " and &quot; as
      // JSON string delimiters so apostrophes inside strings are ignored.
      const closeB = firstCh === "[" ? "]" : "}";
      let depth  = 0;
      let inStr  = false; // are we inside a JSON "..." string?
      let j      = vStart;

      while (j < tag.length) {
        // &quot; entity acts as a JSON string delimiter
        if (tag.slice(j, j + 6) === "&quot;") {
          inStr = !inStr;
          j += 6;
          continue;
        }
        const ch = tag[j];
        // literal " acts as a JSON string delimiter
        if (ch === '"') { inStr = !inStr; j++; continue; }
        // inside a string — skip everything (apostrophes, brackets, etc.)
        if (inStr) { j++; continue; }
        if (ch === firstCh) { depth++; j++; continue; }
        if (ch === closeB) {
          depth--;
          j++;
          if (depth === 0) break;
          continue;
        }
        j++;
      }
      raw   = tag.slice(vStart, j);
      nextI = j; // the closing HTML quote (if any) is right after j — skip over it
    } else {
      // ── Plain string value ─────────────────────────────────────────
      let j = vStart;
      while (j < tag.length && tag[j] !== openQ) j++;
      raw   = tag.slice(vStart, j);
      nextI = j + 1;
    }

    result[key] = parseAttrValue(raw);
    i = nextI;
  }
  return result;
}

/**
 * Extract all day-card opening tags from an HTML file.
 * Returns an array of attribute objects.
 */
function extractCardAttrs(html) {
  const cards = [];
  let search = 0;
  while (true) {
    // Find a div that has "day-card" in its class
    const divIdx = html.indexOf('<div', search);
    if (divIdx === -1) break;

    const closeIdx = findTagClose(html, divIdx + 4);
    if (closeIdx === -1) break;

    const tag = html.slice(divIdx, closeIdx + 1);
    // Quick check: does this tag's class contain "day-card"?
    const classMatch = tag.match(/\bclass=["']([^"']*)["']/);
    if (classMatch && classMatch[1].includes("day-card")) {
      cards.push(extractDataAttrs(tag));
    }
    search = closeIdx + 1;
  }
  return cards;
}

/**
 * Extract phase metadata from the HTML.
 * Each phase-block contains a phase-header with tag, title, meta, and goal.
 */
function extractPhases(html) {
  const phases = [];
  const blockRe = /<div\s+class="phase-block"[\s\S]*?(?=<div\s+class="phase-block"|$)/g;

  let match;
  while ((match = blockRe.exec(html)) !== null) {
    const block = match[0];

    const tag      = (block.match(/<span\s+class="phase-tag[^"]*">([^<]+)<\/span>/) || [])[1] || "";
    const title    = (block.match(/<span\s+class="phase-title">([^<]+)<\/span>/)    || [])[1] || "";
    const meta     = (block.match(/<span\s+class="phase-meta">([^<]+)<\/span>/)     || [])[1] || "";
    const goalM    = block.match(/<div\s+class="week-goal">([^<]+)<\/div>/);
    const weekGoal = goalM ? goalM[1].replace(/^⟶\s*/, "").trim() : "";

    // phase ID is the id of the week-group div inside this block
    const idMatch = block.match(/<div\s+class="week-group"\s+id="([^"]+)"/);
    const phaseId = idMatch ? idMatch[1] : tag.toLowerCase().replace(/\s+/g, "");

    if (tag) {
      phases.push({
        phaseId,
        label:    decodeEntities(tag.trim()),
        title:    decodeEntities(title.trim()),
        meta:     decodeEntities(meta.trim()),
        weekGoal: decodeEntities(weekGoal),
      });
    }
  }
  return phases;
}

/**
 * Extract hero section metadata (description + stats).
 */
function extractHeroMeta(html) {
  const desc  = (html.match(/<p\s+class="hero-desc">([^<]+)<\/p>/) || [])[1] || "";
  const eye   = (html.match(/<div\s+class="hero-eyebrow">([^<]+)<\/div>/) || [])[1] || "";
  const stats = [];
  const statRe = /<div\s+class="stat"><div\s+class="stat-val">([^<]+)<\/div><div\s+class="stat-label">([^<]+)<\/div><\/div>/g;
  let m;
  while ((m = statRe.exec(html)) !== null) {
    stats.push({ value: m[1], label: m[2] });
  }
  return {
    description: decodeEntities(desc.trim()),
    eyebrow:     decodeEntities(eye.trim()),
    stats,
  };
}

// ─────────────────────────────────────────────────────────
// CARD NORMALIZERS
// Each normalizer takes raw data-* attrs and returns a clean
// MongoDB card document (without _id, planId, order — added later)
// ─────────────────────────────────────────────────────────

function normalizeDayPlanCard(attrs) {
  return {
    day:           parseInt(attrs["day"] || attrs["day-num"] || "0", 10),
    topic:         toStr(attrs["topic"]),
    effort:        toStr(attrs["effort"]) || "normal",
    phase:         toStr(attrs["phase"]  || attrs["week"]),
    weekLabel:     toStr(attrs["week-label"] || attrs["week"]),
    topics:        toArray(attrs["topics"] || attrs["learn"] || []),
    practice:      toString(attrs["practice"] || attrs["outcome"] || ""),
    gains:         toArray(attrs["gains"] || []),
    sources:       toSourceArray(attrs["sources"] || []),
    ...(attrs["day-type"]  && { dayType:      toStr(attrs["day-type"])  }),
    ...(attrs["time"]      && { timeEstimate: toStr(attrs["time"])      }),
    ...(attrs["concepts"]  && { concepts:     toRichArray(attrs["concepts"]) }),
    ...(attrs["color"]     && { color:        toStr(attrs["color"])     }),
  };
}

function normalizeStoriesCard(attrs) {
  return {
    storyId:            toStr(attrs["story-id"]),
    title:              toStr(attrs["title"]),
    userStory:          toString(attrs["user-story"] || ""),
    acceptanceCriteria: toArray(attrs["ac"]  || []),
    part:               toStr(attrs["part"]),
    section:            parseInt(attrs["section"] || "0", 10),
    sectionTitle:       toStr(attrs["section-title"]),
    color:              toStr(attrs["color"]),
    phase:              toStr(attrs["part"]),
  };
}

function normalizeReferenceCard(attrs) {
  // SLDS module cards
  const isSlds = "mod-num" in attrs || "slds-classes" in attrs;
  // API guide cards
  const isApi  = "sec" in attrs && !isSlds;

  if (isSlds) {
    return {
      entryId:    toStr(attrs["entry-id"]),
      topic:      toStr(attrs["topic"]),
      modNum:     parseInt(attrs["mod-num"] || "0", 10),
      modTitle:   toStr(attrs["mod-title"]),
      level:      toStr(attrs["level"]),
      gains:      toArray(attrs["gains"] || []),
      sldsClasses:toStr(attrs["slds-classes"]),
      sldsCode:   toStr(attrs["slds-code"]),
      customCss:  toStr(attrs["custom-css"]),
      cssNa:      toStr(attrs["css-na"]),
      scenario:   toStr(attrs["scenario"]),
      notes:      toStr(attrs["notes"]),
      color:      toStr(attrs["color"]),
      sources:    toSourceArray(attrs["sources"] || []),
      phase:      attrs["mod-num"] ? `m${attrs["mod-num"]}` : "",
    };
  }

  if (isApi) {
    const apiFilter = toStr(attrs["filter"]);
    // data-sec is a rich structured object (definition, methods, keyTerms, etc.)
    // Store it as-is for rich rendering. Phase groups by data-filter (ch1-ch6).
    const secRaw = attrs["sec"];
    const secObj = (secRaw && typeof secRaw === "object") ? secRaw : {};
    // Derive snippet: prefer data-snippet, fall back to sec.definition
    const snippet = toStr(attrs["snippet"]) || toStr(secObj["definition"]) || "";
    return {
      entryId:    toStr(attrs["id"]),
      title:      toStr(attrs["title"]),
      topic:      toStr(attrs["title"]),
      filter:     apiFilter,
      icon:       toStr(attrs["icon"]),
      sec:        secObj,          // stored as structured object
      snippet:    snippet,
      color:      toStr(attrs["color"]),
      phase:      apiFilter,       // group by chapter (ch1-ch6), not by sec title
    };
  }

  // tech-core-concepts
  return {
    entryId:     toStr(attrs["topic-id"]),
    title:       toStr(attrs["title"]),
    topic:       toStr(attrs["title"]),
    filter:      toStr(attrs["filter"]),
    difficulty:  toStr(attrs["difficulty"]),
    icon:        toStr(attrs["icon"]),
    color:       toStr(attrs["color"]),
    timeEstimate:toStr(attrs["time"]),
    core:        toRichArray(attrs["core"]     || []),
    why:         toString(attrs["why"]     || ""),
    deeper:      toArray(attrs["deeper"]   || []),
    commands:    toCommandsArray(attrs["commands"] || []),
    projects:    toArray(attrs["projects"] || []),
    sources:     toSourceArray(attrs["sources"] || []),
    phase:       toStr(attrs["filter"]),
  };
}

// ─────────────────────────────────────────────────────────
// HELPER COERCIONS
// ─────────────────────────────────────────────────────────

// Like toArray but preserves object items (for rich concept/core data)
// Plain string arrays still work; object arrays keep their shape for the frontend.
function toRichArray(val) {
  if (Array.isArray(val)) return val; // keep objects as-is
  if (!val || val === "") return [];
  if (typeof val === "string") return [val];
  return [];
}

// Coerce any value to a plain string
function toStr(val) {
  if (!val && val !== 0) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.title || val.id || val.name || "";
  return String(val);
}

function toArray(val) {
  if (Array.isArray(val)) return val.map(item =>
    (typeof item === "object" && item !== null)
      ? (item.title || item.id || item.name || JSON.stringify(item))
      : String(item)
  );
  if (!val || val === "") return [];
  if (typeof val === "string") return [val];
  return [];
}

// data-commands is a plain object in tech-core-concepts, not an array.
// Formats: {"Nav": "ls, cd"} or {"setup": ["git init", ...]}
// Flatten both into readable strings.
function toCommandsArray(val) {
  if (Array.isArray(val)) return val.map(String);
  if (!val || val === "") return [];
  if (typeof val === "string") return [val];
  if (typeof val === "object") {
    return Object.entries(val).map(([cat, cmds]) => {
      const label = cat.replace(/([A-Z])/g, " $1").trim();
      const list  = Array.isArray(cmds) ? cmds.join("  ·  ") : String(cmds);
      return label + ":  " + list;
    });
  }
  return [];
}

function toString(val) {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join("\n");
  return String(val || "");
}

function toSourceArray(val) {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr.map(s => {
    if (typeof s === "object" && s !== null) {
      return { t: s.t || s.title || "", u: s.u || s.url || "", b: s.b || s.badge || "docs" };
    }
    return { t: String(s), u: "", b: "docs" };
  });
}

// ─────────────────────────────────────────────────────────
// PHASE DERIVATION FOR STORIES / REFERENCE
// Stories don't have explicit phase-block HTML — derive from card data.
// ─────────────────────────────────────────────────────────

// Fallback for DAY_PLAN files that don't have <phase-block> HTML.
// Derives phases from the cards' own phase + weekLabel fields.
function deriveDayPlanPhases(cards) {
  const seen = new Map();
  for (const card of cards) {
    const id = String(card.phase || "default");
    if (!seen.has(id)) {
      seen.set(id, {
        phaseId:  id,
        label:    card.weekLabel || id.toUpperCase(),
        title:    card.weekLabel || id,
        meta:     "",
        weekGoal: "",
      });
    }
  }
  return Array.from(seen.values());
}

function deriveStoriesPhases(cards) {
  const seen  = new Map(); // phaseId → phase object
  for (const card of cards) {
    const id = card.part || `s${card.section}`;
    if (!seen.has(id)) {
      seen.set(id, {
        phaseId:  id,
        label:    `S${card.section}`,
        title:    card.sectionTitle || `Section ${card.section}`,
        meta:     "",
        weekGoal: "",
      });
    }
  }
  return Array.from(seen.values());
}

// Chapter names for api-complete-guide (ch1–ch6)
const API_CHAPTER_NAMES = {
  ch1: "Foundations",
  ch2: "HTTP & Requests",
  ch3: "REST & Structure",
  ch4: "Auth & Security",
  ch5: "Using & Building APIs",
  ch6: "Advanced Patterns",
};

function deriveReferencePhases(cards, cardType, filename) {
  // slds: group by modNum, api: group by filter (ch1-ch6), tech: group by filter
  const seen = new Map();
  for (const card of cards) {
    const id = String(card.phase || "default");
    if (!seen.has(id)) {
      // For API guide, use the chapter name lookup
      const chapterName = API_CHAPTER_NAMES[id];
      const rawLabel = chapterName || card.modTitle || card.filter || id;
      const label = typeof rawLabel === "object" ? (rawLabel?.title || rawLabel?.id || id) : String(rawLabel);
      seen.set(id, {
        phaseId:  id,
        label:    chapterName ? id.toUpperCase() : id.toUpperCase(),
        title:    label,
        meta:     "",
        weekGoal: "",
      });
    }
  }
  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────
// PROCESS ONE HTML FILE
// Returns { plan, phases, cards }
// ─────────────────────────────────────────────────────────

function processFile(filename, html) {
  const meta      = PLAN_REGISTRY[filename];
  if (!meta) {
    console.warn(`  ⚠ No registry entry for ${filename} — skipping`);
    return null;
  }

  const heroMeta  = extractHeroMeta(html);
  const rawCards  = extractCardAttrs(html);

  // Normalize cards based on cardType
  let normalizedCards;
  let phases;

  if (meta.cardType === CARD_TYPES.DAY_PLAN) {
    normalizedCards = rawCards.map(a => normalizeDayPlanCard(a));
    const htmlPhases = extractPhases(html);
    // Only use HTML phases if at least one card's phase field matches a phaseId.
    // Java's phase-block HTML uses "Phase 1"/"Phase 2" as labels but cards use
    // "beginner"/"intermediate"/"advanced" — they never match, so fall back to
    // deriving phases directly from the card data.
    const cardPhaseIds = new Set(normalizedCards.map(c => c.phase).filter(Boolean));
    const htmlPhasesMatch = htmlPhases.some(p => cardPhaseIds.has(p.phaseId));
    phases = (htmlPhases.length && htmlPhasesMatch)
      ? htmlPhases
      : deriveDayPlanPhases(normalizedCards);
  } else if (meta.cardType === CARD_TYPES.STORIES) {
    normalizedCards = rawCards.map(a => normalizeStoriesCard(a));
    phases          = deriveStoriesPhases(normalizedCards);
  } else {
    normalizedCards = rawCards.map(a => normalizeReferenceCard(a));
    phases          = extractPhases(html).length
      ? extractPhases(html)
      : deriveReferencePhases(normalizedCards, meta.cardType, filename);
  }

  const plan = {
    ...meta,
    description:  heroMeta.description,
    eyebrow:      heroMeta.eyebrow,
    heroStats:    heroMeta.stats,
    totalCards:   normalizedCards.length,
    totalPhases:  phases.length,
    createdAt:    new Date(),
  };

  return { plan, phases, cards: normalizedCards };
}

// ─────────────────────────────────────────────────────────
// MAIN — connect, wipe, seed
// ─────────────────────────────────────────────────────────

async function main() {
  console.log("\n🃏  DayDeck Migration Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Validate source directory
  if (!existsSync(SOURCE_DIR)) {
    console.error(`❌  migration-source/ directory not found at:\n    ${SOURCE_DIR}`);
    console.error("    Copy your DayDeck study/*.html files into migration-source/ and re-run.\n");
    process.exit(1);
  }

  const htmlFiles = readdirSync(SOURCE_DIR).filter(f => f.endsWith(".html"));
  if (htmlFiles.length === 0) {
    console.error("❌  No .html files found in migration-source/\n");
    process.exit(1);
  }

  console.log(`📂  Found ${htmlFiles.length} HTML files in migration-source/`);
  htmlFiles.forEach(f => console.log(`    • ${f}`));
  console.log();

  // Parse all files
  const allPlans  = [];
  const allPhases = [];
  const allCards  = [];

  for (const filename of htmlFiles) {
    const filepath = join(SOURCE_DIR, filename);
    const html     = readFileSync(filepath, "utf-8");
    process.stdout.write(`📄  Parsing ${filename} … `);

    const result = processFile(filename, html);
    if (!result) { console.log("skipped"); continue; }

    const { plan, phases, cards } = result;
    allPlans.push(plan);

    // Stamp planSlug on phases and cards
    phases.forEach((p, i) => {
      allPhases.push({ ...p, planSlug: plan.slug, order: i + 1, createdAt: new Date() });
    });
    cards.forEach((c, i) => {
      allCards.push({
        ...c,
        planSlug: plan.slug,
        cardType: plan.cardType,
        order:    i + 1,
        createdAt: new Date(),
      });
    });

    console.log(`✓  ${cards.length} cards, ${phases.length} phases`);
  }

  console.log(`\n📊  Total: ${allPlans.length} plans, ${allPhases.length} phases, ${allCards.length} cards`);

  // Connect to MongoDB
  console.log("\n🔌  Connecting to MongoDB …");
  const uri    = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGODB_URI not set. Make sure .env.local exists.\n");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`✓  Connected → database: ${DB_NAME}`);

    // Drop existing collections
    console.log("\n🗑   Dropping existing collections …");
    for (const col of ["plans", "phases", "cards"]) {
      await db.collection(col).drop().catch(() => {/* ok if doesn't exist */});
      console.log(`    dropped: ${col}`);
    }

    // Insert plans
    console.log("\n⬆️   Inserting plans …");
    const planResult = await db.collection("plans").insertMany(allPlans);
    console.log(`    ✓ ${planResult.insertedCount} plans`);

    // Build planSlug → _id map for cross-referencing
    const planDocs    = await db.collection("plans").find({}).toArray();
    const slugToId    = {};
    planDocs.forEach(p => { slugToId[p.slug] = p._id; });

    // Stamp planId (ObjectId) on phases and cards
    const phasesWithId = allPhases.map(p => ({ ...p, planId: slugToId[p.planSlug] }));
    const cardsWithId  = allCards.map(c => ({ ...c, planId: slugToId[c.planSlug]  }));

    // Insert phases
    console.log("⬆️   Inserting phases …");
    const phaseResult = await db.collection("phases").insertMany(phasesWithId);
    console.log(`    ✓ ${phaseResult.insertedCount} phases`);

    // Insert cards
    console.log("⬆️   Inserting cards …");
    // Batch in chunks of 500 to avoid driver limits
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < cardsWithId.length; i += CHUNK) {
      const chunk  = cardsWithId.slice(i, i + CHUNK);
      const result = await db.collection("cards").insertMany(chunk);
      inserted    += result.insertedCount;
      process.stdout.write(`\r    ✓ ${inserted} / ${cardsWithId.length} cards`);
    }
    console.log();

    // Create indexes for fast lookups
    console.log("\n🔍  Creating indexes …");
    await db.collection("plans").createIndex({ slug:     1 }, { unique: true });
    await db.collection("plans").createIndex({ order:    1 });
    await db.collection("phases").createIndex({ planId:  1, order: 1 });
    await db.collection("phases").createIndex({ planSlug:1, phaseId: 1 });
    await db.collection("cards").createIndex({ planId:   1, order: 1 });
    await db.collection("cards").createIndex({ planSlug: 1, phase: 1 });
    await db.collection("cards").createIndex({ planSlug: 1, cardType: 1 });
    console.log("    ✓ indexes created");

    console.log("\n✅  Migration complete!\n");
    console.log("Next steps:");
    console.log("  1. npm run dev");
    console.log("  2. Visit http://localhost:3000");
    console.log("  3. Admin: http://localhost:3000/admin\n");

  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error("\n❌  Migration failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});