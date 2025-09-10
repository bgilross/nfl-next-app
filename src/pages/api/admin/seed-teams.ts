import type { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "@/lib/prisma"
import teamLegend from "../../../context/team_legend.json"

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST")
		return res.status(405).json({ error: "Method not allowed" })
	const apiKey = process.env.SCRAPE_API_KEY
	if (apiKey && req.headers["x-api-key"] !== apiKey) {
		return res.status(403).json({ error: "Forbidden" })
	}
	try {
		const names: string[] = Object.values(teamLegend as any)
		let created = 0
		for (const name of names) {
			const existing = await prisma.team.findUnique({ where: { name } })
			if (!existing) {
				await prisma.team.create({ data: { name } })
				created++
			}
		}
		const total = await prisma.team.count()
		res.json({ ok: true, created, total })
	} catch (e: any) {
		res.status(500).json({ error: e?.message || "seed failed" })
	}
}
