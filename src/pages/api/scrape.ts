import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeAndStore } from "@/lib/scrape"

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const apiKey = process.env.SCRAPE_API_KEY
	if (apiKey && req.headers["x-api-key"] !== apiKey) {
		return res.status(403).json({ error: "Forbidden" })
	}
	const seasonParam = req.query.season
	const seasonYear =
		typeof seasonParam === "string" ? parseInt(seasonParam, 10) : undefined
	try {
		const result = await scrapeAndStore(seasonYear)
		res.status(200).json({ ok: true, result })
	} catch (e: any) {
		res.status(500).json({ error: e?.message || "scrape failed" })
	}
}
