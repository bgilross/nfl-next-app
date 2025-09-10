import * as React from "react"
import { getBackendTeamAggregate } from "../logic/logic"
import { useDataContext } from "../context/dataContext"

export default function TeamRankingsDisplay({
	teamKey,
}: {
	teamKey?: "team1" | "team2"
}) {
	const { currentData, teamName } = useDataContext()
	const [agg, setAgg] = React.useState<any | null>(null)

	React.useEffect(() => {
		let cancelled = false
		;(async () => {
			if (teamKey === "team2") {
				const loc = currentData?.team2?.location
				const disp = currentData?.team2?.teamData?.displayName || null
				if (!loc && !disp) {
					if (!cancelled) setAgg(null)
				} else {
					const res = await getBackendTeamAggregate(loc, disp)
					if (!cancelled) setAgg(res)
				}
				return
			}

			// default: team1
			const loc1 = currentData?.team1?.location
			const disp1 = currentData?.team1?.teamData?.displayName || teamName
			if (!loc1 && !disp1) {
				if (!cancelled) setAgg(null)
			} else {
				const res1 = await getBackendTeamAggregate(loc1, disp1)
				if (!cancelled) setAgg(res1)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [
		teamKey,
		currentData?.team1?.location,
		currentData?.team1?.teamData?.displayName,
		currentData?.team2?.location,
		currentData?.team2?.teamData?.displayName,
		teamName,
	])

	const categories = agg?.categories || {}

	const normalizeLabel = (label: string) => {
		if (!label) return label
		// remove leading 'opponent' or 'opp' prefix
		return label.replace(/^\s*(?:opponent|opp)[:\-\s]+/i, "").trim()
	}

	const baseTeamName =
		currentData?.team1?.teamData?.displayName || teamName || "Team 1"

	return (
		<div style={{ fontSize: ".8rem", padding: 8 }}>
			<div style={{ minWidth: 220 }}>
				<div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
					{teamKey
						? `${
								currentData?.[teamKey]?.teamData?.displayName || "Team"
						  } Opponent Stats`
						: `${
								currentData?.team1?.teamData?.displayName ||
								teamName ||
								"Team 1"
						  } Opponent Stats`}
				</div>
				<ul
					style={{
						display: "flex",
						gap: 8,
						listStyle: "none",
						padding: 0,
						flexWrap: "wrap",
					}}
				>
					{Object.entries(categories).map(([category, row]: any) => (
						<li
							key={category}
							style={{
								margin: 4,
								border: "1px solid #eee",
								borderRadius: 6,
								padding: 8,
							}}
						>
							<div style={{ fontWeight: 600, marginBottom: 4 }}>
								{normalizeLabel(category)}
							</div>
							<ul style={{ paddingLeft: 14 }}>
								{row.current_year != null && (
									<li>
										{row.current_year}: {row.value_current}
									</li>
								)}
								<li>Last 3: {row.last_3}</li>
								<li>Last 1: {row.last_1}</li>
								<li>Home: {row.home}</li>
								<li>Away: {row.away}</li>
								{row.prev_year != null && (
									<li>
										{row.prev_year}: {row.value_prev}
									</li>
								)}
							</ul>
						</li>
					))}
					{!Object.keys(categories).length && (
						<li style={{ color: "#999" }}>
							No rankings yet. Try running the scraper.
						</li>
					)}
				</ul>
			</div>
		</div>
	)
}
