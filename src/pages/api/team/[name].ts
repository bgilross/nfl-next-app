import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Candidate = { teamId: number; name: string; score: number };

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function score(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 70;
  // token overlap
  const at = new Set(a.split(" "));
  const bt = new Set(b.split(" "));
  let overlap = 0;
  for (const t of at) if (bt.has(t)) overlap++;
  return overlap > 0 ? 40 + overlap * 5 : 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = String(req.query.name || "");
    if (!raw) return res.status(400).json({ error: "Missing name" });
    const n = normalize(raw);

    const teams = await prisma.team.findMany();
    const candidates: Candidate[] = teams.map((t) => ({
      teamId: t.id,
      name: t.name,
      score: score(normalize(t.name), n),
    }));
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < 40) {
      return res.status(404).json({ error: "No good match", candidates: candidates.slice(0, 10) });
    }

    const snapshots = await prisma.statSnapshot.findMany({
      where: { teamId: best.teamId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { category: true },
    });

    res.status(200).json({
      query: raw,
      best,
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
