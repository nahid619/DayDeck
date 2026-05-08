// app/api/cards/route.js
export const dynamic = "force-dynamic";

import { getDb }                               from "@/lib/mongodb";
import { ok, fail, parseBody, requireAuth }    from "@/lib/apiHelpers";

// GET /api/cards?planSlug=apex-30day[&phase=w1]
export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const planSlug = searchParams.get("planSlug");
    const phase    = searchParams.get("phase");

    if (!planSlug) return fail("planSlug query param is required");

    const db    = await getDb();
    const query = { planSlug };
    if (phase) query.phase = phase;

    const cards = await db
      .collection("cards")
      .find(query)
      .sort({ order: 1 })
      .toArray();

    return ok(cards);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// POST /api/cards — create a new card
export async function POST(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await parseBody(request);
    if (!body) return fail("Invalid JSON body");

    const { planSlug, planId, cardType, phase, ...cardData } = body;

    if (!planSlug || !cardType) {
      return fail("planSlug and cardType are required");
    }

    const db = await getDb();

    // Verify the plan exists
    const plan = await db.collection("plans").findOne({ slug: planSlug });
    if (!plan) return fail(`Plan "${planSlug}" not found`, 404);

    // Next order in this plan
    const last = await db
      .collection("cards")
      .find({ planSlug })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = last.length ? last[0].order + 1 : 1;

    const doc = {
      planSlug,
      planId:    planId || plan._id,
      cardType,
      phase:     phase || "",
      order,
      createdAt: new Date(),
      ...cardData,
    };

    const result = await db.collection("cards").insertOne(doc);

    // Keep totalCards on the plan in sync
    await db
      .collection("plans")
      .updateOne({ slug: planSlug }, { $inc: { totalCards: 1 } });

    return ok({ ...doc, _id: result.insertedId }, 201);
  } catch (e) {
    return fail(e.message, 500);
  }
}