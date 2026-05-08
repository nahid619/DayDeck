// lib/apiHelpers.js
// Tiny helpers so every route uses the same response shape.

import { NextResponse } from "next/server";
import { ObjectId }     from "mongodb";
import { getToken }     from "next-auth/jwt";

export const ok    = (data, status = 200) =>
  NextResponse.json({ success: true,  data },    { status });

export const fail  = (message, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export const notFound = (what = "Document") =>
  fail(`${what} not found`, 404);

/** Convert a string id to ObjectId, returning null if invalid */
export function toObjectId(id) {
  try { return new ObjectId(id); }
  catch { return null; }
}

/** Safely parse JSON body from a request */
export async function parseBody(request) {
  try { return await request.json(); }
  catch { return null; }
}

/**
 * Check for a valid NextAuth JWT on the incoming request.
 * Returns a 401 NextResponse if not authenticated, or null if auth passed.
 *
 * Usage in any route handler:
 *   const authError = await requireAuth(request);
 *   if (authError) return authError;
 */
export async function requireAuth(request) {
  const token = await getToken({
    req:    request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) return fail("Unauthorized", 401);
  return null;
}