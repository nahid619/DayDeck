// lib/authOptions.js
// Shared NextAuth configuration.
// Imported by:
//   app/api/auth/[...nextauth]/route.js  — to create the handler
//   app/admin/dashboard/page.js          — to call getServerSession(authOptions)

import CredentialsProvider from "next-auth/providers/credentials";
// next-auth v4 ships CJS — unwrap .default when bundled as ESM
const Credentials = CredentialsProvider.default ?? CredentialsProvider;

// Constant-time string comparison to prevent timing attacks.
// Falls back gracefully if the Web Crypto API is unavailable.
async function safeEqual(a, b) {
  if (!a || !b) return false;
  if (typeof TextEncoder === "undefined") return a === b; // SSR fallback
  const enc  = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  // crypto.subtle.timingSafeEqual requires equal-length buffers
  if (bufA.byteLength !== bufB.byteLength) return false;
  const key = await crypto.subtle.importKey(
    "raw", bufA, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, bufA),
    crypto.subtle.sign("HMAC", key, bufB),
  ]);
  // Compare the two HMAC signatures byte-by-byte in constant time
  const vA = new Uint8Array(sigA);
  const vB = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < vA.length; i++) diff |= vA[i] ^ vB[i];
  return diff === 0;
}

export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validUsername = process.env.ADMIN_USERNAME;
        const validPassword = process.env.ADMIN_PASSWORD;

        const [usernameOk, passwordOk] = await Promise.all([
          safeEqual(credentials?.username, validUsername),
          safeEqual(credentials?.password, validPassword),
        ]);

        if (usernameOk && passwordOk) {
          return { id: "1", name: "Admin", role: "admin" };
        }

        // Fixed: add a small delay on every failed attempt to slow down
        // brute-force attacks without adding latency to the happy path.
        await new Promise(r => setTimeout(r, 600));
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (token) session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/admin",
    error:  "/admin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};