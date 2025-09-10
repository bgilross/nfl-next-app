import type { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "@/lib/prisma"

export default async function handler(
	_req: NextApiRequest,
	res: NextApiResponse
) {
	try {
		const categories = await prisma.category.findMany()
		const data: any[] = []
		for (const cat of categories) {
			const snaps = await prisma.statSnapshot.findMany({
				where: { categoryId: cat.id },
				orderBy: { createdAt: "desc" },
				take: 500,
				include: { team: true },
			})
			const seen = new Set<number>()
			const latestPerTeam: typeof snaps = []
			for (const s of snaps) {
				if (seen.has(s.teamId)) continue
				seen.add(s.teamId)
				latestPerTeam.push(s)
			}
			data.push({
				category: { id: cat.id, slug: cat.slug, name: cat.name },
				teams: latestPerTeam.map((s) => ({
					team: s.team.name,
					rank: s.rank,
					valueCurrent: s.valueCurrent,
					createdAt: s.createdAt,
				})),
			})
		}
		res.json({ categories: data })
	} catch (e: any) {
		res.status(500).json({ error: e?.message || "failed" })
	}
}
