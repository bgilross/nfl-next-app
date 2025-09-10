import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
    res.status(200).json({ teams });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
