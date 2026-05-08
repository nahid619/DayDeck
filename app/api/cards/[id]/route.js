// app/api/cards/[id]/route.js
export const dynamic = "force-dynamic";

import { getDb }                                        from "@/lib/mongodb";
import { ok, fail, notFound, toObjectId, parseBody,
         requireAuth }                                  from "@/lib/apiHelpers";

// GET /api/cards/[id]
export async function GET(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const db   = await getDb();
    const card = await db.collection("cards").findOne({ _id: oid });
    if (!card) return notFound("Card");
    return ok(card);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// PUT /api/cards/[id]
export async function PUT(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const body = await parseBody(request);
    if (!body) return fail("Invalid JSON body");

    // Strip immutable / computed fields
    const { _id, createdAt, planSlug, planId, cardType, order, ...rest } = body;

    const db = await getDb();
    const result = await db.collection("cards").findOneAndUpdate(
      { _id: oid },
      { $set: { ...rest, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return notFound("Card");
    return ok(result);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// DELETE /api/cards/[id]
export async function DELETE(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const db   = await getDb();
    const card = await db.collection("cards").findOne({ _id: oid });
    if (!card) return notFound("Card");

    await db.collection("cards").deleteOne({ _id: oid });

    // Decrement totalCards on the parent plan
    await db
      .collection("plans")
      .updateOne({ slug: card.planSlug }, { $inc: { totalCards: -1 } });

    return ok({ deleted: true });
  } catch (e) {
    return fail(e.message, 500);
  }
}