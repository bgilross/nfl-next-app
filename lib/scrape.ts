import * as cheerio from "cheerio"
import { prisma } from "./prisma"
import { logger } from "./logger"

export const STAT_ENDPOINTS: { slug: string; name: string; url: string }[] = [
	{
		slug: "opponent-rushing-touchdowns-per-game",
		name: "Opponent Rush TDs/G",
		url: "https://www.teamrankings.com/nfl/stat/opponent-rushing-touchdowns-per-game",
	},
	{
		slug: "opponent-completion-pct",
		name: "Opponent Completion %",
		url: "https://www.teamrankings.com/nfl/stat/opponent-completion-pct",
	},
	{
		slug: "opponent-rushing-yards-per-game",
		name: "Opponent Rush Yds/G",
		url: "https://www.teamrankings.com/nfl/stat/opponent-rushing-yards-per-game",
	},
	{
		slug: "opponent-passing-yards-per-game",
		name: "Opponent Pass Yds/G",
		url: "https://www.teamrankings.com/nfl/stat/opponent-passing-yards-per-game",
	},
	{
		slug: "opponent-gross-passing-yards-per-game",
		name: "Opponent Gross Pass Yds/G",
		url: "https://www.teamrankings.com/nfl/stat/opponent-gross-passing-yards-per-game",
	},
	{
		slug: "opponent-sacks-per-game",
		name: "Opponent Sacks/G",
		url: "https://www.teamrankings.com/nfl/stat/opponent-sacks-per-game",
	},
]

export interface ParsedRow {
	team: string
	rank?: number
	currentYear?: number
	prevYear?: number
	valueCurrent?: number
	valuePrev?: number
	last1?: number
	last3?: number
	home?: number
	away?: number
	seasonYear?: number
}

export function shouldInsertSnapshot(
	recent: { valueCurrent: number | null; rank: number | null } | null,
	row: ParsedRow
): boolean {
	if (!recent) return true
	const rc = recent.valueCurrent
	const rr = recent.rank
	const sameValue = rc === (row.valueCurrent ?? null)
	const sameRank = rr === (row.rank ?? null)
	return !(sameValue && sameRank)
}

function parseTable(html: string, seasonYear?: number): ParsedRow[] {
	const $ = cheerio.load(html)
	const rows: ParsedRow[] = []

	const headerCells: string[] = []
	const headerRow = $("table thead tr").first()
	if (headerRow.length) {
		headerRow.find("th").each((_, th) => {
			const txt = $(th).text().trim().toLowerCase().replace(/\s+/g, " ")
			headerCells.push(txt)
		})
	}

	const findIndex = (candidates: (string | RegExp)[]): number => {
		for (const cand of candidates) {
			const idx = headerCells.findIndex((h) =>
				cand instanceof RegExp ? cand.test(h) : h === cand
			)
			if (idx !== -1) return idx
		}
		return -1
	}

	const yearIndices = headerCells
		.map((h, i) => ({ h, i }))
		.filter(({ h }) => /\b20\d{2}\b/.test(h))
	let currentYearIdx = yearIndices[0]?.i ?? -1
	let prevYearIdx = yearIndices[1]?.i ?? -1
	let currentYearVal = yearIndices[0] ? parseInt(yearIndices[0].h) : undefined
	let prevYearVal = yearIndices[1] ? parseInt(yearIndices[1].h) : undefined
	if (seasonYear && yearIndices.length) {
		const matchIdx = yearIndices.find((y) => parseInt(y.h) === seasonYear)
		if (matchIdx) {
			currentYearIdx = matchIdx.i
			currentYearVal = seasonYear
			const prevMatch = yearIndices.find(
				(y) => parseInt(y.h) === seasonYear - 1
			)
			if (prevMatch) {
				prevYearIdx = prevMatch.i
				prevYearVal = seasonYear - 1
			}
		}
	}

	const last1Idx = findIndex(["last 1", /last\s*1/])
	const last3Idx = findIndex(["last 3", /last\s*3/])
	const homeIdx = findIndex(["home"])
	const awayIdx = findIndex(["away"])

	$("table tbody tr").each((_, el) => {
		const cells = $(el).find("td")
		if (cells.length < 2) return
		const rankTxt = $(cells[0]).text().trim()
		const rank = parseInt(rankTxt, 10)
		const team = $(cells[1]).text().trim()
		if (!team) return
		const getNum = (idx: number): number | undefined => {
			if (idx < 0 || idx >= cells.length) return undefined
			const v = parseFloat($(cells[idx]).text().trim().replace(/,/g, ""))
			return isNaN(v) ? undefined : v
		}
		const valueCurrent = getNum(currentYearIdx >= 0 ? currentYearIdx : 2)
		const valuePrev = getNum(prevYearIdx)
		const last1 = getNum(last1Idx)
		const last3 = getNum(last3Idx)
		const home = getNum(homeIdx)
		const away = getNum(awayIdx)
		rows.push({
			team,
			rank: isNaN(rank) ? undefined : rank,
			valueCurrent,
			valuePrev,
			last1,
			last3,
			home,
			away,
			currentYear: currentYearVal,
			prevYear: prevYearVal,
			seasonYear,
		})
	})

	if (!rows.length) {
		$("table tr").each((_, el) => {
			const cells = $(el).find("td")
			if (cells.length < 2) return
			const rank = parseInt($(cells[0]).text().trim(), 10)
			const team = $(cells[1]).text().trim()
			const valueCurrent = parseFloat($(cells[2]).text().trim()) || undefined
			rows.push({
				team,
				rank: isNaN(rank) ? undefined : rank,
				valueCurrent,
				seasonYear,
			})
		})
	}
	return rows
}

export async function scrapeAndStore(seasonYear?: number) {
	logger.info({ seasonYear }, "scrape start")
	const results: Record<string, number> = {}
	for (const cat of STAT_ENDPOINTS) {
		logger.info({ category: cat.slug }, "fetch category")
		const res = await fetch(cat.url, {
			headers: { "User-Agent": "Mozilla/5.0 (compatible; StatsScraper/1.0)" },
		})
		if (!res.ok) {
			logger.warn({ status: res.status, url: cat.url }, "fetch failed")
			continue
		}
		const html = await res.text()
		const rows = parseTable(html, seasonYear).slice(0, 40)
		const category = await prisma.category.upsert({
			where: { slug: cat.slug },
			update: { name: cat.name },
			create: { slug: cat.slug, name: cat.name },
		})
		for (const r of rows) {
			if (!r.team) continue
			const team = await prisma.team.upsert({
				where: { name: r.team },
				update: {},
				create: { name: r.team },
			})
			let recent: any = null
			if (r.valueCurrent != null || r.rank != null) {
				recent = await prisma.statSnapshot.findFirst({
					where: {
						teamId: team.id,
						categoryId: category.id,
						createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
					},
					orderBy: { createdAt: "desc" },
				})
			}
			if (
				!shouldInsertSnapshot(
					recent && { valueCurrent: recent.valueCurrent, rank: recent.rank },
					r
				)
			) {
				logger.debug(
					{ team: r.team, category: cat.slug },
					"skip duplicate snapshot"
				)
				continue
			}
			await prisma.statSnapshot.create({
				data: {
					teamId: team.id,
					categoryId: category.id,
					rank: r.rank,
					valueCurrent: r.valueCurrent,
					valuePrev: r.valuePrev,
					last1: r.last1,
					last3: r.last3,
					home: r.home,
					away: r.away,
					currentYear: r.currentYear,
					prevYear: r.prevYear,
					seasonYear: r.seasonYear ?? seasonYear,
				},
			})
		}
		results[cat.slug] = rows.length
		logger.info({ category: cat.slug, rows: rows.length }, "category stored")
	}
	logger.info({ results }, "scrape complete")
	return { stored: results }
}
