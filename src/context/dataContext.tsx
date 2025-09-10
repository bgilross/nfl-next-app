import React, { createContext, useContext, useState } from "react"
import teamLegend from "./team_legend.json"
import { getSeasonYear, getNextOpp, getTeamStatData } from "../logic/logic"

type CurrentData = any

type Ctx = {
	teamName: string
	setTeamName: (v: string) => void
	selectedYear: number
	setSelectedYear: (y: number) => void
	loading: boolean
	error: string | null
	opp: string | null
	currentData: CurrentData
	handleGetAllData: () => Promise<void>
	teamOptions: string[]
}

export const DataContext = createContext<Ctx>({} as any)

// no-op

export const DataProvider: React.FC<React.PropsWithChildren<{}>> = ({
	children,
}) => {
	const baseYear = getSeasonYear()
	const [teamName, setTeamName] = useState("")
	const [selectedYear, setSelectedYear] = useState<number>(baseYear)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [opp, setOpp] = useState<string | null>(null)
	const [currentData, setCurrentData] = useState<any>({})

	const handleGetAllData = async () => {
		if (!teamName) return
		setLoading(true)
		setError(null)
		try {
			const [teamStats, nextOpp] = await Promise.all([
				getTeamStatData(teamName, selectedYear),
				getNextOpp(teamName, selectedYear),
			])
			let oppStats: any = null
			if (nextOpp) {
				try {
					oppStats = await getTeamStatData(nextOpp, selectedYear)
				} catch (e) {
					// ignore opponent fetch errors
					oppStats = null
				}
			}
			setCurrentData({ team1: teamStats, team2: oppStats })
			setOpp(nextOpp || null)
		} catch (e: any) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<DataContext.Provider
			value={{
				handleGetAllData,
				teamName,
				setTeamName,
				currentData,
				opp,
				loading,
				error,
				teamOptions: Object.values(teamLegend as any),
				selectedYear,
				setSelectedYear,
			}}
		>
			{children}
		</DataContext.Provider>
	)
}

export const useDataContext = () => useContext(DataContext)
