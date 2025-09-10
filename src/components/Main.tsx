import * as React from "react"
import { useDataContext } from "../context/dataContext"
import TextField from "@mui/material/TextField"
import Autocomplete from "@mui/material/Autocomplete"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import TeamRankingsDisplay from "./TeamRankingsDisplay"
import TeamTable from "./TeamTable"
import DebugPanel from "./DebugPanel"
// Hover player popover is now handled inside TeamTable

const Main: React.FC = () => {
	const {
		teamName,
		setTeamName,
		opp,
		currentData,
		handleGetAllData,
		loading,
		error,
		teamOptions,
		selectedYear,
		setSelectedYear,
	} = useDataContext()

	// Hover handling removed; TeamTable manages hover popper internally

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleGetAllData()
	}

	return (
		<div style={{ paddingBottom: 40 }}>
			<div
				style={{
					display: "flex",
					gap: 12,
					alignItems: "center",
					padding: 8,
					flexWrap: "wrap",
				}}
			>
				<Autocomplete
					sx={{ width: 260 }}
					options={teamOptions}
					value={teamName || null}
					onChange={(_, val) => setTeamName(val || "")}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Select Team"
							placeholder="Start typing..."
							size="small"
							onKeyDown={handleKeyDown}
						/>
					)}
				/>
				<div>
					<label style={{ fontSize: 12, color: "#555" }}>Season</label>
					<Select
						size="small"
						value={selectedYear}
						onChange={(e) => setSelectedYear(Number(e.target.value))}
						style={{ width: 110, marginLeft: 6 }}
					>
						{[...Array(7)].map((_, i) => {
							const baseYear =
								new Date().getMonth() >= 8
									? new Date().getFullYear()
									: new Date().getFullYear() - 1
							const year = baseYear - i
							return (
								<MenuItem
									key={year}
									value={year}
								>
									{year}
								</MenuItem>
							)
						})}
					</Select>
				</div>
				<Button
					variant="contained"
					onClick={handleGetAllData}
					disabled={!teamName || loading}
				>
					{loading ? "Loading..." : "Load"}
				</Button>
				{loading && <CircularProgress size={20} />}
				{error && <span style={{ color: "red" }}>{error}</span>}
			</div>
			<div
				style={{
					fontSize: "0.8rem",
					color: "#555",
					paddingLeft: 8,
					minHeight: 20,
				}}
			>
				{opp && !loading && <span>Next Opponent: {opp}</span>}
			</div>
			<div
				style={{
					width: "100%",
					padding: 10,
					margin: "10px 0",
					display: "flex",
					justifyContent: "space-around",
					gap: 24,
					flexWrap: "wrap",
				}}
			>
				{currentData?.team1 && (
					<div style={{ flex: 1, minWidth: 480 }}>
						<TeamRankingsDisplay teamKey="team1" />
						<TeamTable
							data={currentData}
							teamNum="team1"
						/>
					</div>
				)}
				{currentData?.team2 && (
					<div style={{ flex: 1, minWidth: 480 }}>
						<TeamRankingsDisplay teamKey="team2" />
						<TeamTable
							data={currentData}
							teamNum="team2"
						/>
					</div>
				)}
			</div>
			<DebugPanel />
		</div>
	)
}

export default Main
