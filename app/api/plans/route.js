// app/api/plans/route.js
export const dynamic = "force-dynamic";

import { getDb }                               from "@/lib/mongodb";
import { ok, fail, parseBody, requireAuth }    from "@/lib/apiHelpers";

// GET /api/plans — return all plans sorted by order
export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const db    = await getDb();
    const plans = await db
      .collection("plans")
      .find({})
      .sort({ order: 1 })
      .toArray();
    return ok(plans);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// POST /api/plans — create a new plan
export async function POST(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await parseBody(request);
    if (!body) return fail("Invalid JSON body");

    const {
      slug, title, fullTitle, emoji, color,
      tabLabel, cardType, description, eyebrow,
    } = body;

    if (!slug || !title || !cardType) {
      return fail("slug, title, and cardType are required");
    }

    const db = await getDb();

    // Prevent duplicate slugs
    const exists = await db.collection("plans").findOne({ slug });
    if (exists) return fail(`A plan with slug "${slug}" already exists`, 409);

    // Assign the next order value
    const last = await db
      .collection("plans")
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = last.length ? last[0].order + 1 : 1;

    const doc = {
      slug,
      title:      title.trim(),
      fullTitle:  fullTitle?.trim() || title.trim(),
      emoji:      emoji       || "📚",
      color:      color       || "#60A5FA",
      tabLabel:   tabLabel?.trim() || title.trim(),
      cardType,
      description: description?.trim() || "",
      eyebrow:     eyebrow?.trim()     || "",
      heroStats:  [],
      totalCards:  0,
      totalPhases: 0,
      order,
      createdAt: new Date(),
    };

    const result = await db.collection("plans").insertOne(doc);
    return ok({ ...doc, _id: result.insertedId }, 201);
  } catch (e) {
    return fail(e.message, 500);
  }
}