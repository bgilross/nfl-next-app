import axios from "axios"
import teamLegend from "../context/team_legend.json"

const http = axios.create({ timeout: 10000 })

const normalize = (s = "") =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9 ]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()

export const getSeasonYear = (date = new Date()) => {
	const m = date.getMonth()
	const y = date.getFullYear()
	return m >= 8 ? y : y - 1
}

const firstThursdayOfSeptember = (seasonYear: number) => {
	const d = new Date(seasonYear, 8, 1)
	const day = d.getDay()
	const offsetToThu = (4 - day + 7) % 7
	d.setDate(d.getDate() + offsetToThu)
	return d
}

export const getWeek = (seasonYear = getSeasonYear(), now = new Date()) => {
	const start = firstThursdayOfSeptember(seasonYear)
	const diffDays = Math.floor(
		(Number(now) - Number(start)) / (1000 * 60 * 60 * 24)
	)
	const week = Math.ceil(diffDays / 7)
	const currentSeason = getSeasonYear()
	if (seasonYear < currentSeason) return 18
	if (week < 1) return 1
	if (week > 18) return 18
	return week
}

const toCandidates = (locationName?: string, displayName?: string) => {
	const cands: string[] = []
	if (locationName) cands.push(locationName)
	if (displayName) cands.push(displayName)
	if (displayName) {
		const parts = displayName.split(" ")
		const nick = parts[parts.length - 1]
		if (displayName.startsWith("Los Angeles")) cands.push(`LA ${nick}`)
		if (displayName.startsWith("New York")) cands.push(`NY ${nick}`)
	}
	return Array.from(new Set(cands))
}

const getTeamID = (teamName: string) => {
	for (const [id, name] of Object.entries(
		teamLegend as Record<string, string>
	)) {
		if (name.toLowerCase().includes(teamName?.toLowerCase())) return id
	}
	return null
}

export const getNextGameID = async (teamName: string) => {
	const teamID = getTeamID(teamName)
	if (!teamID) return null
	const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamID}`
	try {
		const response = await http.get(apiUrl)
		return response.data.team?.nextEvent?.[0]?.id || null
	} catch {
		return null
	}
}

export const getNextOpp = async (
	teamName: string,
	seasonYear = getSeasonYear()
) => {
	// nextEvent only applies to current season
	if (seasonYear !== getSeasonYear()) return null
	const now = new Date()
	const nextGameID = await getNextGameID(teamName)
	const fetchGameSummary = async (gameId: string) => {
		try {
			const apiUrl = `https://cdn.espn.com/core/nfl/game?xhr=1&gameId=${gameId}`
			const response = await http.get(apiUrl)
			const pkg = response.data?.gamepackageJSON
			const t1 = pkg?.boxscore?.teams?.[0]?.team?.displayName
			const t2 = pkg?.boxscore?.teams?.[1]?.team?.displayName
			const gameDate = pkg?.header?.competitions?.[0]?.date
			return { t1, t2, gameDate }
		} catch {
			return null
		}
	}

	// If nextEvent returned a game, prefer it only if it's in the future
	if (nextGameID) {
		const summary = await fetchGameSummary(nextGameID)
		if (summary && summary.gameDate) {
			const gd = new Date(summary.gameDate)
			if (gd > now) {
				if (summary.t1?.toLowerCase().includes(teamName.toLowerCase()))
					return summary.t2
				if (summary.t2?.toLowerCase().includes(teamName.toLowerCase()))
					return summary.t1
			}
		}
	}

	// Fallback: search upcoming weeks (current week -> 18) for the first future game
	const currentWeek = getWeek(seasonYear)
	for (let w = currentWeek; w <= 18; w++) {
		const gid = await getTeamsGameIdByWeek(teamName, w, seasonYear)
		if (!gid) continue
		const summary = await fetchGameSummary(gid)
		if (!summary || !summary.gameDate) continue
		const gd = new Date(summary.gameDate)
		if (gd <= now) continue
		if (summary.t1?.toLowerCase().includes(teamName.toLowerCase()))
			return summary.t2
		if (summary.t2?.toLowerCase().includes(teamName.toLowerCase()))
			return summary.t1
	}

	return null
}

const getTeamsGameIdByWeek = async (
	teamName: string,
	week: number,
	seasonYear = getSeasonYear()
) => {
	const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${seasonYear}&seasontype=2&week=${week}`
	try {
		const response = await http.get(apiUrl)
		const events: any[] = response.data.events || []
		if (!events.length) return null
		const teamGame = events.find((e) =>
			e.name?.toLowerCase().includes(teamName.toLowerCase())
		)
		return teamGame ? teamGame.id : null
	} catch {
		return null
	}
}

const getAllTeamsGameIds = async (
	teamName: string,
	seasonYear = getSeasonYear()
) => {
	const nowSeason = getSeasonYear()
	const currentWeek = seasonYear < nowSeason ? 18 : getWeek(seasonYear)
	const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1)
	const results = await Promise.all(
		weeks.map((w) => getTeamsGameIdByWeek(teamName, w, seasonYear))
	)
	return results.filter(Boolean) as string[]
}

const getPrevGameData = async (
	teamName: string,
	seasonYear = getSeasonYear()
) => {
	const apiUrl = `https://cdn.espn.com/core/nfl/boxscore?xhr=1&gameId=`
	const gameIds = await getAllTeamsGameIds(teamName, seasonYear)
	if (!gameIds.length) return []
	try {
		const responses = await Promise.all(
			gameIds.map((gameId) => http.get(`${apiUrl}${gameId}`))
		)
		return responses
	} catch {
		return []
	}
}

export const getTeamStatData = async (
	teamName: string,
	seasonYear = getSeasonYear()
) => {
	let allStats: any = {
		team: teamName,
		location: "",
		teamData: {},
		gamesData: [],
		categories: {},
	}
	const gameData: any[] = await getPrevGameData(teamName, seasonYear)
	if (!gameData || !Array.isArray(gameData) || gameData.length === 0)
		return allStats
	try {
		const competitors =
			gameData[0]?.data?.gamepackageJSON?.header?.competitions?.[0]
				?.competitors || []
		competitors.forEach((team: any) => {
			if (
				team.team.displayName.toLowerCase().includes(teamName.toLowerCase())
			) {
				allStats.location = team.team.location
				allStats.teamData = team.team
			}
		})
	} catch {}

	for (const game of gameData) {
		if (game.data && game.data.gamepackageJSON) {
			const boxScore = game.data.gamepackageJSON.boxscore.players
			const header = game.data.gamepackageJSON.header
			const homeTeam = header.competitions[0].competitors.find(
				(t: any) => t.homeAway === "home"
			)
			const awayTeam = header.competitions[0].competitors.find(
				(t: any) => t.homeAway === "away"
			)
			if (boxScore) {
				for (const team of boxScore) {
					if (
						team.team.displayName.toLowerCase().includes(teamName.toLowerCase())
					) {
						for (const statCategory of team.statistics) {
							if (
								["passing", "rushing", "receiving", "defensive"].includes(
									statCategory.name.toLowerCase()
								)
							) {
								const weekIndex = (header.week || 1) - 1
								if (!allStats.categories[statCategory.name])
									allStats.categories[statCategory.name] = {}
								for (const player of statCategory.athletes) {
									if (
										!allStats.categories[statCategory.name][
											player.athlete.displayName
										]
									) {
										allStats.categories[statCategory.name][
											player.athlete.displayName
										] = {}
									}
									for (const [i, stat] of (player.stats || []).entries()) {
										const description = statCategory.descriptions[i]
										if (
											!allStats.categories[statCategory.name][
												player.athlete.displayName
											][description]
										) {
											allStats.categories[statCategory.name][
												player.athlete.displayName
											][description] = Array(getWeek(seasonYear)).fill(0)
										}
										allStats.categories[statCategory.name][
											player.athlete.displayName
										][description][weekIndex] = stat
									}
								}
							}
						}
					}
				}
			}
			allStats.gamesData.push({
				week: header.week,
				date: header.competitions[0].date,
				boxScore,
				homeTeam: {
					name: homeTeam.team.displayName,
					abbreviation: homeTeam.team.abbreviation,
					score: homeTeam.score,
					result: homeTeam.winner ? "W" : "L",
					location: homeTeam.team.location,
					teamData: homeTeam.team,
				},
				awayTeam: {
					name: awayTeam.team.displayName,
					abbreviation: awayTeam.team.abbreviation,
					score: awayTeam.score,
					result: awayTeam.winner ? "W" : "L",
					location: awayTeam.team.location,
					teamData: awayTeam.team,
				},
			})
		}
	}
	return allStats
}

export const getBackendTeamAggregate = async (
	locationName?: string,
	displayName?: string
) => {
	const candidates = toCandidates(locationName, displayName)
	// try direct team endpoint with several candidates
	for (const name of candidates) {
		try {
			const res = await fetch(`/api/team/${encodeURIComponent(name)}`)
			if (!res.ok) continue
			const data = await res.json()
			if (!data?.snapshots) continue
			const categories: Record<string, any> = {}
			for (const snap of data.snapshots) {
				const key = snap.category?.name || snap.category?.slug || "unknown"
				if (!categories[key]) categories[key] = {}
				if (!categories[key].current_year) {
					categories[key] = {
						current_year: snap.currentYear ?? null,
						prev_year: snap.prevYear ?? null,
						value_current: snap.valueCurrent ?? null,
						value_prev: snap.valuePrev ?? null,
						last_1: snap.last1 ?? null,
						last_3: snap.last3 ?? null,
						home: snap.home ?? null,
						away: snap.away ?? null,
					}
				}
			}
			return { team: data.team, categories }
		} catch {}
	}
	// fallback: best match via /api/teams
	try {
		const baseQ = normalize(displayName || locationName || "")
		if (!baseQ) return null
		const teamsRes = await fetch(`/api/teams`)
		if (!teamsRes.ok) return null
		const teams = await teamsRes.json()
		let best: any = null
		let bestScore = 0
		const qTokens = baseQ.split(" ").filter(Boolean)
		for (const t of teams) {
			const tn = normalize(t.name)
			let score = 0
			if (tn === baseQ) score += 100
			if (tn && baseQ.includes(tn)) score += 60
			if (tn && tn.includes(baseQ)) score += 50
			const tTokens = tn.split(" ").filter(Boolean)
			for (const tok of tTokens) if (qTokens.includes(tok)) score += 10
			const lastQ = qTokens[qTokens.length - 1]
			const lastT = tTokens[tTokens.length - 1]
			if (lastQ && lastT && lastQ === lastT) score += 20
			if (score > bestScore) {
				bestScore = score
				best = t
			}
		}
		if (best && bestScore > 0) {
			const res = await fetch(`/api/team/${encodeURIComponent(best.name)}`)
			if (res.ok) {
				const data = await res.json()
				if (data?.snapshots) {
					const categories: Record<string, any> = {}
					for (const snap of data.snapshots) {
						const key = snap.category?.name || snap.category?.slug || "unknown"
						if (!categories[key]) categories[key] = {}
						if (!categories[key].current_year) {
							categories[key] = {
								current_year: snap.currentYear ?? null,
								prev_year: snap.prevYear ?? null,
								value_current: snap.valueCurrent ?? null,
								value_prev: snap.valuePrev ?? null,
								last_1: snap.last1 ?? null,
								last_3: snap.last3 ?? null,
								home: snap.home ?? null,
								away: snap.away ?? null,
							}
						}
					}
					return { team: data.team, categories }
				}
			}
		}
	} catch {}
	return null
}
