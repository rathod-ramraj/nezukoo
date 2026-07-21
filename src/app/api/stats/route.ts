import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();

  const [users, sites, subscribers] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("sites").countDocuments(),
    db.collection("subscribers").countDocuments(),
  ]);

  const agg = await db
    .collection("sites")
    .aggregate([
      {
        $group: {
          _id: null,
          delivered: { $sum: { $ifNull: ["$deliveredTotal", 0] } },
        },
      },
    ])
    .toArray();
  const delivered = agg[0]?.delivered || 0;

  return NextResponse.json(
    { users, sites, subscribers, delivered },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
