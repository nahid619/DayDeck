// lib/cardSchema.js
export const CARD_TYPES = {
  DAY_PLAN:  "day-plan",
  STORIES:   "stories",
  REFERENCE: "reference",
};

export const PLAN_REGISTRY = {
  "sf-l1-stories.html": {
    slug: "sf-l1-stories", title: "SF L1 Stories",
    fullTitle: "Salesforce Admin L1 — User Stories", emoji: "☁️",
    color: "#0176D3", tabLabel: "☁️ SF L1 Stories",
    cardType: CARD_TYPES.STORIES, order: 1,
  },
  "sf-l2-stories.html": {
    slug: "sf-l2-stories", title: "SF L2 Stories",
    fullTitle: "Salesforce Admin L2 — User Stories", emoji: "☁️",
    color: "#7b61ff", tabLabel: "☁️ SF L2 Stories",
    cardType: CARD_TYPES.STORIES, order: 2,
  },
  "python-40day.html": {
    slug: "python-40day", title: "Python 40-Day",
    fullTitle: "Python — Zero to Automation", emoji: "🐍",
    color: "#06d6a0", tabLabel: "🐍 Python 40-Day",
    cardType: CARD_TYPES.DAY_PLAN, order: 3,
  },
  "ai-learning-journey.html": {
    slug: "ai-learning-journey", title: "AI Journey",
    fullTitle: "AI & Machine Learning Journey", emoji: "🤖",
    color: "#06d6a0", tabLabel: "🤖 AI Journey",
    cardType: CARD_TYPES.DAY_PLAN, order: 4,
  },
  "tech-core-concepts.html": {
    slug: "tech-core-concepts", title: "Tech Concepts",
    fullTitle: "Core Technical Concepts", emoji: "🧠",
    color: "#06d6a0", tabLabel: "🧠 Tech Concepts",
    cardType: CARD_TYPES.REFERENCE, order: 5,
  },
  "api-complete-guide.html": {
    slug: "api-complete-guide", title: "API Guide",
    fullTitle: "API — Complete Guide", emoji: "🌐",
    color: "#60A5FA", tabLabel: "🌐 API Guide",
    cardType: CARD_TYPES.REFERENCE, order: 6,
  },
  "apex-30day.html": {
    slug: "apex-30day", title: "Apex 30-Day",
    fullTitle: "Salesforce Apex — Noob to Production", emoji: "☁️",
    color: "#7b61ff", tabLabel: "☁️ Apex 30-Day",
    cardType: CARD_TYPES.DAY_PLAN, order: 7,
  },
  "lwc-30day.html": {
    slug: "lwc-30day", title: "LWC 30-Day",
    fullTitle: "Lightning Web Components — 30 Days", emoji: "⚡",
    color: "#00d4ff", tabLabel: "⚡ LWC 30-Day",
    cardType: CARD_TYPES.DAY_PLAN, order: 8,
  },
  "slds-doc.html": {
    slug: "slds-doc", title: "SLDS Reference",
    fullTitle: "Salesforce Lightning Design System Reference", emoji: "⚡",
    color: "#ffd166", tabLabel: "⚡ SLDS Reference",
    cardType: CARD_TYPES.REFERENCE, order: 9,
  },
  "java-60day.html": {
    slug: "java-60day", title: "Java 60-Day",
    fullTitle: "Java — 60 Day Mastery Plan", emoji: "☕",
    color: "#34D399", tabLabel: "☕ Java 60-Day",
    cardType: CARD_TYPES.DAY_PLAN, order: 10,
  },
  "experience-cloud-30day.html": {
    slug: "experience-cloud-30day", title: "Experience Cloud",
    fullTitle: "Salesforce Experience Cloud — 30 Days", emoji: "🌐",
    color: "#0176D3", tabLabel: "🌐 Experience Cloud 30-Day",
    cardType: CARD_TYPES.DAY_PLAN, order: 11,
  },
  "ai_engineer_30day_roadmap.html": {
    slug: "ai-engineer-30day", title: "AI Engineer 30-Day",
    fullTitle: "Junior AI Engineer — 30-Day Roadmap", emoji: "🤖",
    color: "#a855f7", tabLabel: "🤖 AI Engineer 30-Day",
    cardType: CARD_TYPES.DAY_PLAN, order: 12,
  },
  "data_structures_guide.html": {
    slug: "data-structures-guide", title: "Data Structures",
    fullTitle: "Data Structures — Zero to Advanced", emoji: "🗂️",
    color: "#f59e0b", tabLabel: "🗂️ Data Structures",
    cardType: CARD_TYPES.DAY_PLAN, order: 13,
  },
  "ai_fundamentals.html": {
    slug: "ai-fundamentals", title: "AI Fundamentals",
    fullTitle: "AI Fundamentals Everyone Should Know", emoji: "🧠",
    color: "#06d6a0", tabLabel: "🧠 AI Fundamentals",
    cardType: CARD_TYPES.DAY_PLAN, order: 14,
  },
  "personal_growth_roadmap.html": {
    slug: "personal-growth-roadmap", title: "Personal Growth",
    fullTitle: "Personal Growth — 6 Pillars", emoji: "🌱",
    color: "#1d6db5", tabLabel: "🌱 Personal Growth",
    cardType: CARD_TYPES.DAY_PLAN, order: 15,
  },
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
};