// lib/mongodb.js
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Missing environment variable: "MONGODB_URI"');
}

const uri     = process.env.MONGODB_URI;
const options = {};

// Fix: use the same global-cache pattern in ALL environments.
// In development, Next.js hot-reloads modules constantly, so without the
// global cache every HMR cycle opens a new connection.
// In production (Vercel serverless), each new function instance is a cold
// start that re-imports this module — without the cache each invocation
// opens a brand-new MongoClient and never reuses it, exhausting the Atlas
// connection pool under real traffic.
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("daydeck");
}