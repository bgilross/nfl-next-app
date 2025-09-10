import * as React from "react"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import Popper from "@mui/material/Popper"
import PlayerTable from "./PlayerTable"

type Categories = Record<string, Record<string, Record<string, number[]>>>

type PlayerStats = {
	name: string
	gamesData: any[]
	categories: Record<string, Record<string, number[]>>
}

export default function TeamTable({
	data,
	teamNum,
}: {
	data: any
	teamNum: "team1" | "team2"
}) {
	const team = data?.[teamNum]
	const categories: Categories = team?.categories || {}
	const gamesData: any[] = team?.gamesData || []

	// Team styling (colors / logo) from ESPN team data
	const teamData = (team && (team.teamData || team.team)) || {}
	const primaryColor = teamData?.color ? `#${teamData.color}` : "#0B5CAB"
	const altColor = teamData?.alternateColor
		? `#${teamData.alternateColor}`
		: "#ffffff"
	const logoUrl = teamData?.logos?.[0]?.href || ""

	const hexToRgba = (hex: string, alpha = 1) => {
		try {
			const h = hex.replace("#", "")
			const bigint = parseInt(
				h.length === 3
					? h
							.split("")
							.map((c) => c + c)
							.join("")
					: h,
				16
			)
			const r = (bigint >> 16) & 255
			const g = (bigint >> 8) & 255
			const b = bigint & 255
			return `rgba(${r}, ${g}, ${b}, ${alpha})`
		} catch {
			return hex
		}
	}

	const isWhite = (hex: string) => {
		const h = (hex || "").replace("#", "").toLowerCase()
		return h === "fff" || h === "ffffff"
	}

	// View controls
	const [view, setView] = React.useState<string>("all-offense")
	// start empty and pick preferred stat (yards/YDS) once options load
	const [statDesc, setStatDesc] = React.useState<string>("")

	// Local hover popper state
	const [hoverOpen, setHoverOpen] = React.useState(false)
	const [hoverPlayer, setHoverPlayer] = React.useState<PlayerStats | null>(null)
	const popperRef = React.useRef<HTMLDivElement | null>(null)
	const rowRef = React.useRef<HTMLElement | null>(null)
	const mousePos = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

	const virtualAnchor = React.useMemo(
		() => ({
			getBoundingClientRect: () => {
				const { x, y } = mousePos.current
				return new DOMRect(x, y, 1, 1)
			},
		}),
		[]
	)

	if (!team || !gamesData.length || !Object.keys(categories).length) {
		return <div>No Table Data</div>
	}

	const numWeeks = gamesData.length
	const weeklyHeaders = gamesData.map((g, i) => (
		<TableCell
			align="right"
			key={i}
			style={{
				backgroundColor: primaryColor,
				color: altColor,
			}}
		>
			<div>W{i + 1}</div>
			<div>{g.awayTeam?.abbreviation}</div>
			<div>@</div>
			<div>{g.homeTeam?.abbreviation}</div>
			<div>{g.awayTeam?.score}</div>
			<div>{g.homeTeam?.score}</div>
		</TableCell>
	))

	const visibleCats = React.useMemo(() => {
		if (view === "all-offense") {
			return ["passing", "rushing", "receiving"].filter(
				(k) => (categories as any)[k]
			)
		}
		if (["passing", "rushing", "receiving", "defensive"].includes(view)) {
			return (categories as any)[view] ? [view] : []
		}
		return []
	}, [view, categories])

	const statOptions = React.useMemo(() => {
		const set = new Set<string>()
		for (const cat of visibleCats) {
			const entries = Object.entries((categories as any)[cat] || {})
			if (!entries.length) continue
			const first = entries[0][1] as Record<string, number[]>
			Object.keys(first).forEach((k) => set.add(k))
		}
		const arr = Array.from(set)
		arr.sort((a, b) =>
			a === "YDS" ? -1 : b === "YDS" ? 1 : a.localeCompare(b)
		)
		return arr
	}, [visibleCats, categories])

	React.useEffect(() => {
		if (!statOptions.length) return
		// prefer any stat that mentions 'yard' (case-insensitive) or exact 'YDS'
		const prefer =
			statOptions.find((s) => /yard/i.test(s)) ||
			statOptions.find((s) => s === "YDS")
		if (prefer) setStatDesc(prefer)
		else if (!statOptions.includes(statDesc)) setStatDesc(statOptions[0])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, JSON.stringify(statOptions)])

	const buildPlayerStats = (playerName: string): PlayerStats => {
		const perCat: Record<string, Record<string, number[]>> = {}
		Object.entries(categories).forEach(([catName, playerMap]) => {
			const statMap = (playerMap as Record<string, Record<string, number[]>>)[
				playerName
			]
			if (statMap) perCat[catName] = statMap
		})
		return { name: playerName, gamesData, categories: perCat }
	}

	const cancel = (
		ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
	) => {
		if (ref.current) {
			clearTimeout(ref.current)
			ref.current = null
		}
	}

	const scheduleOpen = (player: PlayerStats) => {
		cancel(closeTimer)
		if (hoverOpen && hoverPlayer?.name === player.name) return
		cancel(openTimer)
		openTimer.current = setTimeout(() => {
			setHoverPlayer(player)
			setHoverOpen(true)
			openTimer.current = null
		}, 100)
	}

	const scheduleClose = () => {
		cancel(openTimer)
		cancel(closeTimer)
		closeTimer.current = setTimeout(() => {
			setHoverOpen(false)
			setHoverPlayer(null)
			closeTimer.current = null
		}, 260)
	}

	return (
		<div>
			<div
				style={{
					display: "flex",
					gap: 8,
					marginBottom: 8,
					alignItems: "center",
				}}
			>
				<label style={{ fontSize: 12, color: "#555" }}>View</label>
				<select
					value={view}
					onChange={(e) => setView(e.target.value)}
				>
					<option value="all-offense">All Offense (Pass/Rush/Recv)</option>
					<option value="passing">Passing</option>
					<option value="rushing">Rushing</option>
					<option value="receiving">Receiving</option>
					<option value="defensive">Defensive</option>
				</select>
				<label style={{ fontSize: 12, color: "#555" }}>Stat</label>
				<select
					value={statDesc}
					onChange={(e) => setStatDesc(e.target.value)}
				>
					{statOptions.map((s) => (
						<option
							key={s}
							value={s}
						>
							{s}
						</option>
					))}
				</select>
			</div>
			<TableContainer
				component={Paper}
				elevation={4}
				style={{
					borderTop: `4px solid ${primaryColor}`,
				}}
			>
				<Table
					padding="none"
					size="small"
					aria-label="team table"
				>
					<TableHead>
						<TableRow>
							<TableCell
								component="th"
								scope="row"
								style={{
									backgroundColor: altColor,
									height: 100,
									textAlign: "center",
									verticalAlign: "middle",
									padding: 0,
								}}
							>
								{logoUrl ? (
									<img
										src={logoUrl}
										alt={team?.teamData?.displayName || "team logo"}
										style={{ height: 90, display: "inline-block" }}
									/>
								) : null}
							</TableCell>
							{weeklyHeaders}
						</TableRow>
					</TableHead>
					<TableBody>
						{visibleCats.map((catKey) => {
							const players = Object.entries((categories as any)[catKey] || {})
							return (
								<React.Fragment key={catKey}>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											colSpan={numWeeks + 1}
											style={{
												fontWeight: 600,
												backgroundColor: primaryColor,
												color: altColor,
												borderLeft: `3px solid ${hexToRgba(altColor, 0.35)}`,
											}}
										>
											{catKey.toUpperCase()} {statDesc ? `– ${statDesc}` : ""}
										</TableCell>
									</TableRow>
									{players.map(([playerName, statMap]) => {
										const arr = (statDesc && (statMap as any)[statDesc]) || []
										const rowBg = isWhite(altColor)
											? hexToRgba(primaryColor, 0.06)
											: hexToRgba(altColor, 0.12)
										const rowText = primaryColor
										return (
											<TableRow
												key={`${catKey}:${playerName}`}
												onPointerEnter={(e) => {
													mousePos.current = { x: e.clientX, y: e.clientY }
													rowRef.current = e.currentTarget as HTMLElement
													scheduleOpen(buildPlayerStats(playerName))
												}}
												onPointerMove={(e) => {
													mousePos.current = { x: e.clientX, y: e.clientY }
													if (!hoverOpen || hoverPlayer?.name !== playerName) {
														scheduleOpen(buildPlayerStats(playerName))
													}
												}}
												onPointerLeave={(e) => {
													const rel = e.relatedTarget as Node | null
													const rowEl = e.currentTarget as HTMLElement
													if (
														rel &&
														(rowEl.contains(rel) ||
															(popperRef.current &&
																popperRef.current.contains(rel)))
													) {
														return
													}
													scheduleClose()
												}}
												style={{
													cursor: "pointer",
													background: rowBg,
													color: rowText,
												}}
											>
												<TableCell style={{ color: rowText }}>
													{playerName}
												</TableCell>
												{Array.from({ length: numWeeks }).map((_, i) => (
													<TableCell
														align="right"
														key={i}
														style={{ color: rowText }}
													>
														{arr?.[i] ?? 0}
													</TableCell>
												))}
											</TableRow>
										)
									})}
								</React.Fragment>
							)
						})}
					</TableBody>
				</Table>
			</TableContainer>
			<Popper
				open={hoverOpen}
				anchorEl={virtualAnchor as any}
				placement="right-start"
				modifiers={[{ name: "offset", options: { offset: [8, 8] } }]}
				onMouseEnter={() => {
					cancel(closeTimer)
				}}
				onMouseLeave={(e) => {
					const rel = e.relatedTarget as Node | null
					if (rel && rowRef.current && rowRef.current.contains(rel)) return
					scheduleClose()
				}}
			>
				<div
					ref={popperRef}
					style={{
						pointerEvents: "auto",
						background: "#fff",
						borderTop: `4px solid ${primaryColor}`,
					}}
				>
					{hoverPlayer && (
						<PlayerTable
							player={hoverPlayer}
							teamInfo={{
								name: teamData?.displayName || team?.team,
								color: primaryColor,
								altColor,
								logoUrl,
							}}
						/>
					)}
				</div>
			</Popper>
		</div>
	)
}
