import * as React from "react"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"

type PlayerStats = {
	name: string
	gamesData: any[]
	categories: Record<string, Record<string, number[]>>
}

type TeamInfo = {
	name?: string
	color?: string
	altColor?: string
	logoUrl?: string
}

const hexToRgba = (hex?: string, alpha = 1) => {
	if (!hex) return `rgba(0,0,0,${alpha})`
	try {
		const h = hex.replace("#", "")
		const full =
			h.length === 3
				? h
						.split("")
						.map((c) => c + c)
						.join("")
				: h
		const bigint = parseInt(full, 16)
		const r = (bigint >> 16) & 255
		const g = (bigint >> 8) & 255
		const b = bigint & 255
		return `rgba(${r}, ${g}, ${b}, ${alpha})`
	} catch {
		return hex
	}
}

export default function PlayerTable({
	player,
	teamInfo,
}: {
	player: PlayerStats
	teamInfo?: TeamInfo
}) {
	const gamesData = player?.gamesData || []
	const numWeeks = gamesData.length
	const categories = player?.categories || {}
	const primaryColor = teamInfo?.color || "#0B5CAB"
	const logoUrl = teamInfo?.logoUrl

	if (!gamesData.length || !Object.keys(categories).length) {
		return <div>Loading</div>
	}

	return (
		<div style={{ padding: 4 }}>
			<TableContainer
				component={Paper}
				elevation={4}
				style={{ borderTop: `4px solid ${primaryColor}` }}
			>
				<Table
					padding="none"
					size="small"
					aria-label="player table"
				>
					<TableHead>
						<TableRow>
							<TableCell
								style={{
									background: hexToRgba(primaryColor, 0.1),
									borderRight: `2px solid ${hexToRgba(primaryColor, 0.25)}`,
								}}
							>
								<div
									style={{ fontSize: 11, color: hexToRgba(primaryColor, 0.9) }}
								>
									STATISTIC
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									{logoUrl ? (
										<img
											src={logoUrl}
											alt="logo"
											width={20}
											height={20}
											style={{ display: "block" }}
										/>
									) : null}
									<span style={{ fontWeight: 600 }}>{player.name}</span>
								</div>
							</TableCell>
							{gamesData.map((g, i) => (
								<TableCell
									align="right"
									key={i}
								>
									<div>W{i + 1}</div>
									<div>{g.awayTeam?.abbreviation}</div>
									<div>@</div>
									<div>{g.homeTeam?.abbreviation}</div>
									<div>{g.awayTeam?.score}</div>
									<div>{g.homeTeam?.score}</div>
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{Object.entries(categories).map(([catName, stats]) => (
							<React.Fragment key={catName}>
								<TableRow>
									<TableCell
										component="th"
										scope="row"
										colSpan={numWeeks + 1}
										style={{
											fontWeight: 600,
											background: hexToRgba(primaryColor, 0.06),
											borderLeft: `3px solid ${hexToRgba(primaryColor, 0.35)}`,
										}}
									>
										{catName.toUpperCase()}
									</TableCell>
								</TableRow>
								{Object.keys(stats).map((desc) => (
									<TableRow key={desc}>
										<TableCell
											component="th"
											scope="row"
										>
											{desc}
										</TableCell>
										{Array.from({ length: numWeeks }).map((_, i) => (
											<TableCell
												align="right"
												key={i}
											>
												{stats[desc]?.[i] ?? 0}
											</TableCell>
										))}
									</TableRow>
								))}
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</div>
	)
}
