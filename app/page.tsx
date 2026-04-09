import { getTopTokens, scoreTrust, washRisk } from "./tokens";
import Link from "next/link";
import SearchBar from "./search";

const CHAINS = [
  { id: "all", label: "All Chains" },
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
  { id: "base", label: "Base" },
  { id: "arbitrum", label: "Arbitrum" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain = "all" } = await searchParams;
  const tokens = await getTopTokens(chain);

  const scored = tokens
    .map((token: any) => ({
      token,
      trust: scoreTrust(token),
      risk: washRisk(token),
    }))
    .sort((a: any, b: any) => b.trust - a.trust);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-400">TrenchRadar</h1>
            <p className="text-gray-400 text-sm mt-1">Legit token rankings. No wash trading bullshit.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/rugs" className="text-xs text-gray-500 hover:text-red-400 transition-all">Rug Radar</a>
            <a href="/report" className="text-xs text-gray-500 hover:text-red-400 transition-all">Report Token</a>
            <a href="/api-access" className="text-xs text-gray-500 hover:text-green-400 transition-all">API Access</a>
            <div className="text-xs text-gray-500">Sorted by Trust Score</div>
          </div>
        </div>

        <SearchBar />

        <div className="flex gap-2 mb-8 flex-wrap">
          {CHAINS.map((c) => (
            <Link
              key={c.id}
              href={`/?chain=${c.id}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                chain === c.id
                  ? "bg-green-500 text-black border-green-500"
                  : "bg-gray-900 text-gray-400 border-gray-700 hover:border-green-700"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-green-400 font-bold text-lg">Trust Score</div>
            <div className="text-gray-400 text-xs mt-1">Composite anti-manipulation rating 0-100</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-yellow-400 font-bold text-lg">Liquidity</div>
            <div className="text-gray-400 text-xs mt-1">Real depth - harder to fake than volume</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-red-400 font-bold text-lg">Wash Risk</div>
            <div className="text-gray-400 text-xs mt-1">Detected manipulation signals</div>
          </div>
        </div>

        <div className="grid grid-cols-8 text-xs text-gray-500 uppercase px-4 mb-2">
          <div>Rank</div>
          <div>Token</div>
          <div>Price</div>
          <div>24h</div>
          <div>Liquidity</div>
          <div>Age</div>
          <div>Wash Risk</div>
          <div>Trust Score</div>
        </div>

        {scored.map(({ token, trust, risk }: any, i: number) => {
          const ageInDays = Math.floor(
            (Date.now() - (token.pairCreatedAt ?? Date.now())) / (1000 * 60 * 60 * 24)
          );
          const priceChange = token.priceChange?.h24 ?? 0;
          const riskColor = risk === "HIGH" ? "text-red-400" : risk === "MEDIUM" ? "text-yellow-400" : "text-green-400";
          const trustColor = trust >= 70 ? "text-green-400" : trust >= 40 ? "text-yellow-400" : "text-red-400";
          const changeColor = priceChange >= 0 ? "text-green-400" : "text-red-400";

          return (
            <Link
              key={i}
              href={`/token/${token.pairAddress}?chain=${token.chainId}`}
              className="grid grid-cols-8 items-center bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 mb-2 hover:border-green-700 hover:bg-gray-800 transition-all cursor-pointer"
            >
              <div className="text-gray-500 font-mono">#{i + 1}</div>
              <div>
                <div className="font-bold text-white">{token.baseToken?.symbol ?? "???"}</div>
                <div className="text-gray-500 text-xs truncate w-24">{token.baseToken?.name ?? ""}</div>
              </div>
              <div className="text-white font-mono text-sm">${Number(token.priceUsd ?? 0).toFixed(6)}</div>
              <div className={`text-sm font-medium ${changeColor}`}>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
              </div>
              <div className="text-white text-sm">${((token.liquidity?.usd ?? 0) / 1000).toFixed(1)}K</div>
              <div className="text-gray-400 text-sm">{ageInDays}d</div>
              <div className={`font-bold text-sm ${riskColor}`}>{risk}</div>
              <div className={`font-bold text-lg ${trustColor}`}>{trust}</div>
            </Link>
          );
        })}

      </div>
    </main>
  );
}