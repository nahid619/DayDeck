// app/api/phases/route.js
export const dynamic = "force-dynamic";

import { getDb }                               from "@/lib/mongodb";
import { ok, fail, parseBody, requireAuth }    from "@/lib/apiHelpers";

// GET /api/phases?planSlug=apex-30day
export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const planSlug = searchParams.get("planSlug");
    if (!planSlug) return fail("planSlug query param is required");

    const db     = await getDb();
    const phases = await db
      .collection("phases")
      .find({ planSlug })
      .sort({ order: 1 })
      .toArray();

    return ok(phases);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// POST /api/phases — create a new phase inside a plan
export async function POST(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await parseBody(request);
    if (!body) return fail("Invalid JSON body");

    const { planSlug, planId, phaseId, label, title, meta, weekGoal } = body;
    if (!planSlug || !phaseId || !label) {
      return fail("planSlug, phaseId, and label are required");
    }

    const db = await getDb();

    // Prevent duplicate phaseId within same plan
    const exists = await db
      .collection("phases")
      .findOne({ planSlug, phaseId });
    if (exists) {
      return fail(`Phase "${phaseId}" already exists in plan "${planSlug}"`, 409);
    }

    // Next order value for this plan
    const last = await db
      .collection("phases")
      .find({ planSlug })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = last.length ? last[0].order + 1 : 1;

    const doc = {
      planSlug,
      planId:    planId  || null,
      phaseId,
      label:     label.trim(),
      title:     title?.trim()    || "",
      meta:      meta?.trim()     || "",
      weekGoal:  weekGoal?.trim() || "",
      order,
      createdAt: new Date(),
    };

    const result = await db.collection("phases").insertOne(doc);

    // Keep totalPhases on the plan in sync
    await db
      .collection("plans")
      .updateOne({ slug: planSlug }, { $inc: { totalPhases: 1 } });

    return ok({ ...doc, _id: result.insertedId }, 201);
  } catch (e) {
    return fail(e.message, 500);
  }
}