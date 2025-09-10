import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const keys = ["DATABASE_URL", "DIRECT_URL", "SCRAPE_API_KEY"];
  const env = Object.fromEntries(keys.map((k) => [k, process.env[k] ? "set" : "missing"]));
  res.status(200).json({ env });
}
