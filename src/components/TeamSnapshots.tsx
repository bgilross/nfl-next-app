import * as React from "react"

type Snapshot = {
	createdAt: string
	category: { id: number; slug: string; name: string }
	rank?: number | null
	valueCurrent?: number | null
	valuePrev?: number | null
	last1?: number | null
	last3?: number | null
	home?: number | null
	away?: number | null
}

export function TeamSnapshots({ snapshots }: { snapshots: Snapshot[] }) {
	// Group by category and take the latest per category
	const byCat = new Map<string, Snapshot>()
	for (const s of snapshots) {
		const key = s.category.slug
		const prev = byCat.get(key)
		if (!prev) byCat.set(key, s)
	}
	const rows = Array.from(byCat.values()).sort((a, b) =>
		a.category.name.localeCompare(b.category.name)
	)

	return (
		<div style={{ overflowX: "auto" }}>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr>
						<th
							style={{
								textAlign: "left",
								padding: 8,
								borderBottom: "1px solid #ddd",
							}}
						>
							Category
						</th>
						<th
							style={{
								textAlign: "right",
								padding: 8,
								borderBottom: "1px solid #ddd",
							}}
						>
							Rank
						</th>
						<th
							style={{
								textAlign: "right",
								padding: 8,
								borderBottom: "1px solid #ddd",
							}}
						>
							Value
						</th>
						<th
							style={{
								textAlign: "left",
								padding: 8,
								borderBottom: "1px solid #ddd",
							}}
						>
							As Of
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr key={r.category.id}>
							<td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
								{r.category.name}
							</td>
							<td
								style={{
									padding: 8,
									borderBottom: "1px solid #f0f0f0",
									textAlign: "right",
								}}
							>
								{r.rank ?? "-"}
							</td>
							<td
								style={{
									padding: 8,
									borderBottom: "1px solid #f0f0f0",
									textAlign: "right",
								}}
							>
								{r.valueCurrent != null ? r.valueCurrent.toFixed(2) : "-"}
							</td>
							<td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
								{new Date(r.createdAt).toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
