import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function score(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 70;
  const at = new Set(a.split(" "));
  const bt = new Set(b.split(" "));
  let overlap = 0;
  for (const t of at) if (bt.has(t)) overlap++;
  return overlap > 0 ? 40 + overlap * 5 : 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || "");
  if (!q) return res.status(400).json({ error: "Missing q" });
  const teams = await prisma.team.findMany();
  const n = normalize(q);
  const results = teams
    .map((t) => ({ name: t.name, score: score(normalize(t.name), n) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.status(200).json({ q, results });
}
