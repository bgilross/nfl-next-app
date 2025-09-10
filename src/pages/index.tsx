import Head from "next/head"
import * as React from "react"
import { DataProvider } from "../context/dataContext"
import Main from "../components/Main"

function AppBody() {
	return (
		<main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
			<h1>NFL BoxScore Redux</h1>
			<Main />
		</main>
	)
}

export default function Home() {
	return (
		<>
			<Head>
				<title>NFL BoxScore Redux</title>
			</Head>
			<DataProvider>
				<AppBody />
			</DataProvider>
		</>
	)
}
