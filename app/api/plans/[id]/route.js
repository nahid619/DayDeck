// app/api/plans/[id]/route.js
export const dynamic = "force-dynamic";

import { getDb }                                        from "@/lib/mongodb";
import { ok, fail, notFound, toObjectId, parseBody,
         requireAuth }                                  from "@/lib/apiHelpers";

// GET /api/plans/[id]
export async function GET(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Fix: validate BEFORE building the query so we never pass { _id: null } to MongoDB
    const isHex24 = id.length === 24 && /^[0-9a-f]{24}$/i.test(id);
    const oid     = isHex24 ? toObjectId(id) : null;
    if (isHex24 && !oid) return fail("Invalid id");

    const query = oid ? { _id: oid } : { slug: id };
    const db    = await getDb();
    const plan  = await db.collection("plans").findOne(query);
    if (!plan) return notFound("Plan");
    return ok(plan);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// PUT /api/plans/[id] — update plan metadata
export async function PUT(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id }  = await params;
    const oid     = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const body = await parseBody(request);
    if (!body) return fail("Invalid JSON body");

    // Strip protected fields the client must not overwrite
    const { _id, createdAt, totalCards, totalPhases, ...rest } = body;

    const db = await getDb();

    // Fetch the existing plan so we can detect a slug change
    const existing = await db.collection("plans").findOne({ _id: oid });
    if (!existing) return notFound("Plan");

    // Check slug uniqueness if slug is being changed
    if (rest.slug && rest.slug !== existing.slug) {
      const conflict = await db
        .collection("plans")
        .findOne({ slug: rest.slug, _id: { $ne: oid } });
      if (conflict) return fail(`Slug "${rest.slug}" is already taken`, 409);

      // Fix: cascade the slug rename to all phases and cards that reference the old slug
      await db.collection("phases").updateMany(
        { planSlug: existing.slug },
        { $set: { planSlug: rest.slug } }
      );
      await db.collection("cards").updateMany(
        { planSlug: existing.slug },
        { $set: { planSlug: rest.slug } }
      );
    }

    const result = await db.collection("plans").findOneAndUpdate(
      { _id: oid },
      { $set: { ...rest, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return notFound("Plan");
    return ok(result);
  } catch (e) {
    return fail(e.message, 500);
  }
}

// DELETE /api/plans/[id] — delete plan + its phases and cards
export async function DELETE(request, { params }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const oid    = toObjectId(id);
    if (!oid) return fail("Invalid id");

    const db = await getDb();

    const plan = await db.collection("plans").findOne({ _id: oid });
    if (!plan) return notFound("Plan");

    // Cascade-delete phases and cards belonging to this plan
    await db.collection("phases").deleteMany({ planSlug: plan.slug });
    await db.collection("cards").deleteMany({ planSlug: plan.slug });
    await db.collection("plans").deleteOne({ _id: oid });

    return ok({ deleted: true, slug: plan.slug });
  } catch (e) {
    return fail(e.message, 500);
  }
}