import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const [teams, categories, snapshots] = await Promise.all([
      prisma.team.count(),
      prisma.category.count(),
      prisma.statSnapshot.count(),
    ]);
    res.status(200).json({ ok: true, teams, categories, snapshots });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
