import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const name = String(req.query.name || "");
    if (!name) return res.status(400).json({ error: "Missing name" });

    const teams = await prisma.team.findMany();
    const n = normalize(name);
    let best = teams[0] || null;
    let bestScore = -1;
    for (const t of teams) {
      const score = normalize(t.name) === n ? 100 : normalize(t.name).includes(n) ? 70 : 0;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }

    if (!best) return res.status(404).json({ error: "No teams" });

    const snapshots = await prisma.statSnapshot.findMany({
      where: { teamId: best.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { category: true },
    });

    res.status(200).json({
      team: best,
      bestScore,
      snapshotCount: snapshots.length,
      snapshots: snapshots.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        category: { id: s.category.id, slug: s.category.slug, name: s.category.name },
        rank: s.rank,
        valueCurrent: s.valueCurrent,
        valuePrev: s.valuePrev,
        last1: s.last1,
        last3: s.last3,
        home: s.home,
        away: s.away,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
