// app/api/phases/[id]/route.js
export const dynamic = "force-dynamic";

import { getDb }                                        from "@/lib/mongodb";
import { ok, fail, notFound, toObjectId, parseBody,
         requireAuth }                                  from "@/lib/apiHelpers";

// GET /api/phases/[id]
export async function GET(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const db    = await getDb();
    const phase = await db.collection("phases").findOne({ _id: oid });
    if (!phase) return notFound("Phase");
    return ok(phase);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// PUT /api/phases/[id]
export async function PUT(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const body = await parseBody(request);
    if (!body) return fail("Invalid JSON body");

    const { _id, createdAt, planSlug, planId, ...rest } = body;

    const db = await getDb();
    const result = await db.collection("phases").findOneAndUpdate(
      { _id: oid },
      { $set: { ...rest, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return notFound("Phase");
    return ok(result);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// DELETE /api/phases/[id] — also deletes all cards in this phase
export async function DELETE(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const db    = await getDb();
    const phase = await db.collection("phases").findOne({ _id: oid });
    if (!phase) return notFound("Phase");

    // Delete all cards that belong to this phase
    const cardResult = await db
      .collection("cards")
      .deleteMany({ planSlug: phase.planSlug, phase: phase.phaseId });

    await db.collection("phases").deleteOne({ _id: oid });

    // Decrement totalPhases on the parent plan
    await db
      .collection("plans")
      .updateOne(
        { slug: phase.planSlug },
        {
          $inc: {
            totalPhases: -1,
            totalCards:  -cardResult.deletedCount,
          },
        }
      );

    return ok({ deleted: true, cardsDeleted: cardResult.deletedCount });
  } catch (e) {
    return fail(e.message, 500);
  }
}