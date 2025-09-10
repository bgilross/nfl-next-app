import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>NFL Next App</title>
      </Head>
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>NFL Next App</h1>
        <p>API routes:</p>
        <ul>
          <li><a href="/api/health">/api/health</a></li>
          <li><a href="/api/debug/env">/api/debug/env</a></li>
          <li><a href="/api/debug/db-info">/api/debug/db-info</a></li>
          <li><a href="/api/teams">/api/teams</a></li>
          <li><a href="/api/team-debug?name=Dallas%20Cowboys">/api/team-debug?name=...</a></li>
        </ul>
      </main>
    </>
  );
}
