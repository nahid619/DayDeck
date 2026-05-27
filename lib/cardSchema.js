// lib/cardSchema.js
// PLAN_REGISTRY has been moved into scripts/migrate.js where it belongs —
// it was only ever used by the seeder and is not needed at runtime.
// The admin panel (MongoDB) is the single source of truth for plans at runtime.

export const CARD_TYPES = {
  DAY_PLAN:  "day-plan",
  STORIES:   "stories",
  REFERENCE: "reference",
  FLEX:      "flex",        // ← freeform multi-section card
};

export const CARD_FIELDS = {
  [CARD_TYPES.DAY_PLAN]: [
    { key: "day",          label: "Day #",         type: "number",   required: true },
    { key: "topic",        label: "Topic",          type: "text",     required: true },
    { key: "effort",       label: "Effort",         type: "select",   options: ["light","normal","heavy"], required: true },
    { key: "phase",        label: "Phase ID",       type: "text",     required: true, hint: "e.g. w1, w2" },
    { key: "weekLabel",    label: "Week Label",     type: "text",     required: true, hint: "e.g. Week 1" },
    { key: "topics",       label: "Topics",         type: "tags",     hint: "What you'll learn" },
    { key: "practice",     label: "Practice",       type: "textarea", hint: "Hands-on task for the day" },
    { key: "gains",        label: "Gains",          type: "tags",     hint: "Skills acquired" },
    { key: "sources",      label: "Sources",        type: "sources" },
    // optional extras
    { key: "color",        label: "Accent Color",   type: "text",     optional: true, hint: "hex e.g. #06d6a0" },
    { key: "dayType",      label: "Day Type",       type: "text",     optional: true, hint: "learning | project | reference" },
    { key: "timeEstimate", label: "Time Estimate",  type: "text",     optional: true },
    { key: "concepts",     label: "Concepts",       type: "tags",     optional: true },
  ],
  [CARD_TYPES.STORIES]: [
    { key: "storyId",            label: "Story ID",           type: "text",     required: true, hint: "e.g. 001" },
    { key: "title",              label: "Title",              type: "text",     required: true },
    { key: "userStory",          label: "User Story",         type: "textarea", required: true },
    { key: "acceptanceCriteria", label: "Acceptance Criteria",type: "tags",     hint: "One item per line" },
    { key: "part",               label: "Part",               type: "text",     hint: "e.g. p1, p2" },
    { key: "section",            label: "Section #",          type: "number" },
    { key: "sectionTitle",       label: "Section Title",      type: "text" },
    { key: "color",              label: "Accent Color",       type: "text",     hint: "hex e.g. #0176D3" },
  ],
  [CARD_TYPES.REFERENCE]: [
    { key: "title",       label: "Title",         type: "text",     required: true },
    { key: "topic",       label: "Topic / Tag",   type: "text" },
    { key: "filter",      label: "Filter",        type: "text",     hint: "filter-bar value" },
    { key: "difficulty",  label: "Difficulty",    type: "select",   options: ["beginner","intermediate","advanced"], optional: true },
    { key: "icon",        label: "Icon",          type: "text",     hint: "emoji" },
    { key: "color",       label: "Accent Color",  type: "text" },
    { key: "snippet",     label: "Snippet",       type: "textarea", hint: "Code snippet or summary" },
    { key: "core",        label: "Core Points",   type: "tags" },
    { key: "why",         label: "Why It Matters",type: "textarea" },
    { key: "deeper",      label: "Go Deeper",     type: "tags" },
    { key: "commands",    label: "Commands",      type: "tags" },
    { key: "projects",    label: "Project Ideas", type: "tags" },
    // slds-specific
    { key: "sldsClasses", label: "SLDS Classes",  type: "text",     optional: true },
    { key: "sldsCode",    label: "SLDS Code",     type: "textarea", optional: true },
    { key: "customCss",   label: "Custom CSS",    type: "textarea", optional: true },
    { key: "cssNa",       label: "CSS Note",      type: "textarea", optional: true },
    { key: "scenario",    label: "Scenario",      type: "textarea", optional: true },
    { key: "notes",       label: "Notes",         type: "textarea", optional: true },
    { key: "gains",       label: "Gains",         type: "tags",     optional: true },
    { key: "sources",     label: "Sources",       type: "sources",  optional: true },
    // api-guide specific
    { key: "sec",         label: "Section",       type: "text",     optional: true },
    { key: "entryId",     label: "Entry ID",      type: "text",     optional: true },
    // slds module fields
    { key: "modNum",      label: "Module Number", type: "number",   optional: true },
    { key: "modTitle",    label: "Module Title",  type: "text",     optional: true },
    { key: "level",       label: "Level",         type: "select",   options: ["beginner","intermediate","advanced"], optional: true },
  ],

  // Flex card: a title + freeform sections defined by the author.
  // Each section: { label: string, type: "text"|"list"|"code", content: string }
  // "text"  → pre-wrap paragraph
  // "list"  → one item per line, rendered as a bulleted list
  // "code"  → monospace code block
  [CARD_TYPES.FLEX]: [
    { key: "title",    label: "Title",        type: "text",          required: true },
    { key: "badge",    label: "Badge / tag",  type: "text",          hint: "e.g. Q85, Project 29" },
    { key: "color",    label: "Accent Color", type: "text",          hint: "hex e.g. #7b61ff" },
    { key: "sections", label: "Sections",     type: "flex-sections" },
  ],
};
