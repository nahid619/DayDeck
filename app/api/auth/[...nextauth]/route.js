// app/api/auth/[...nextauth]/route.js
// NextAuth v4 requires explicit GET/POST wrappers in Next.js 15
// to avoid the async params incompatibility that returns HTML instead of JSON.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

// next-auth v4 ships CJS — unwrap .default when bundled as ESM
const NextAuthHandler = NextAuth.default ?? NextAuth;
const handler = NextAuthHandler(authOptions);

export async function GET(req, ctx) {
  return handler(req, ctx);
}

export async function POST(req, ctx) {
  return handler(req, ctx);
}