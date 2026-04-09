import { scoreTrust, washRisk, scoreBreakdown } from "../../tokens";
import { enrichToken } from "../../enrichment";
import { supabase } from "../../supabase";
import WatchlistButton from "../../watchlist";
import ScoreChart from "../../ScoreChart";

async function fetchTokenByPairAddress(address: string) {
  try {
    // First try as pair address on all chains
    const chains = ["solana", "ethereum", "base", "arbitrum", "bsc"];
    for (const chain of chains) {
      const r = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/${chain}/${address}`,
        { next: { revalidate: 60 } }
      );
      const d = await r.json();
      if (d?.pair) return d.pair;
    }

    // Then try as token address
    const r = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { next: { revalidate: 60 } }
    );
    const d = await r.json();
    if (d?.pairs?.length > 0) {
      return d.pairs.sort((a: any, b: any) =>
        (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
      )[0];
    }

    return null;
  } catch {
    return null;
  }
}

function getRedFlags(token: any, bd: any, enriched: any): string[] {
  const flags: string[] = [];
  if (token.pairCreatedAt && bd.ageInDays < 3) flags.push("Token is less than 3 days old — no track record whatsoever.");
  if (bd.liquidity < 10000) flags.push("Liquidity under $10K — a single whale can crash this instantly.");
  if (bd.volumeToMcap > 5) flags.push(`Volume is ${bd.volumeToMcap}x the market cap in 24h — textbook wash trading signal.`);
  else if (bd.volumeToMcap > 2) flags.push(`Volume/MCap ratio of ${bd.volumeToMcap}x is suspiciously high — possible manufactured activity.`);
  if (bd.txns < 10) flags.push("Fewer than 10 transactions in 24h — almost no real trading activity.");
  const buyRatio = bd.buys / (bd.txns || 1);
  if (buyRatio > 0.85) flags.push(`${Math.round(buyRatio * 100)}% of transactions are buys — abnormal ratio, possible coordinated pump.`);
  if (buyRatio < 0.15) flags.push(`${Math.round((1 - buyRatio) * 100)}% of transactions are sells — heavy distribution, insiders likely dumping.`);
  if (bd.liquidity < 50000 && bd.ageInDays < 7) flags.push("New token with thin liquidity — classic setup for a rug pull.");
  if (bd.priceChange24h < -40) flags.push(`Price dropped ${Math.abs(bd.priceChange24h)}% in 24h — severe sell-off, possible exit scam in progress.`);
  if (bd.priceChange24h > 200) flags.push(`Price pumped ${bd.priceChange24h}% in 24h — likely coordinated pump, dump usually follows.`);
  if (enriched.top5Pct > 80) flags.push(`Top 5 wallets hold ${enriched.top5Pct}% of supply — extreme concentration, one sell wipes the chart.`);
  else if (enriched.top5Pct > 50) flags.push(`Top 5 wallets hold ${enriched.top5Pct}% of supply — high concentration risk.`);
  if (enriched.devHolding > 0) flags.push("Dev wallet still holds tokens — watch for insider dump.");
  if (!enriched.lpLock.locked && bd.ageInDays < 30) flags.push("Liquidity is NOT locked — devs can pull funds at any time.");
  return flags;
}

export default async function TokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ chain?: string }>;
}) {
  const { address } = await params;
  await searchParams;

  const token = await fetchTokenByPairAddress(address);

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">Token not found.</div>
          <div className="text-gray-600 text-xs mb-4">Make sure this is a valid pair address.</div>
          <a href="/" className="text-green-400 underline">Go back to rankings</a>
        </div>
      </main>
    );
  }

  const trust = scoreTrust(token);
  const risk = washRisk(token);
  const bd = scoreBreakdown(token);
  const enriched = await enrichToken(token);
  const flags = getRedFlags(token, bd, enriched);

  try {
    await supabase.from("score_history").insert({
      pair_address: address,
      trust_score: trust,
      wash_risk: risk,
      price_usd: Number(token.priceUsd ?? 0),
      liquidity: bd.liquidity,
    });
  } catch {}

  const trustColor = trust >= 70 ? "text-green-400" : trust >= 40 ? "text-yellow-400" : "text-red-400";
  const riskColor = risk === "HIGH" ? "text-red-400" : risk === "MEDIUM" ? "text-yellow-400" : "text-green-400";

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        <a href="/" className="text-gray-500 text-sm hover:text-green-400 transition-all mb-6 inline-block">
          Back to rankings
        </a>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">{token.baseToken?.symbol}</h1>
              <p className="text-gray-400 mt-1">{token.baseToken?.name}</p>
              <p className="text-gray-600 text-xs mt-1 font-mono">{token.baseToken?.address}</p>
            </div>
            <div className="text-right">
              <div className={`text-6xl font-bold ${trustColor}`}>{trust}</div>
              <div className="text-gray-400 text-sm">Trust Score</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Price</div>
            <div className="text-white text-2xl font-mono">${Number(token.priceUsd ?? 0).toFixed(6)}</div>
            <div className={`text-sm mt-1 ${bd.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {bd.priceChange24h >= 0 ? "+" : ""}{bd.priceChange24h}% (24h)
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Wash Risk</div>
            <div className={`text-2xl font-bold ${riskColor}`}>{risk}</div>
            <div className="text-gray-500 text-xs mt-1">Vol/MCap ratio: {bd.volumeToMcap}x</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Liquidity</div>
            <div className="text-white text-2xl">${(bd.liquidity / 1000).toFixed(1)}K</div>
            <div className="text-gray-500 text-xs mt-1">
              {bd.liquidity > 500000 ? "Strong" : bd.liquidity > 100000 ? "Moderate" : "Thin - easy to manipulate"}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Pair Age</div>
            <div className="text-white text-2xl">{token.pairCreatedAt ? `${bd.ageInDays}d` : "Unknown"}</div>
            <div className="text-gray-500 text-xs mt-1">
              {!token.pairCreatedAt ? "Age data unavailable" : bd.ageInDays > 180 ? "Established" : bd.ageInDays > 30 ? "Developing" : "Very new - high risk"}
            </div>
          </div>
        </div>

        <ScoreChart pairAddress={address} />

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Holder Concentration</h2>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${
              enriched.top5Pct > 80 ? "bg-red-900 text-red-400" :
              enriched.top5Pct > 50 ? "bg-yellow-900 text-yellow-400" :
              "bg-green-900 text-green-400"
            }`}>
              Top 5 hold {enriched.top5Pct}%
            </div>
          </div>
          {enriched.holders.length === 0 ? (
            <div className="text-gray-600 text-sm">Holder data unavailable</div>
          ) : (
            <div className="space-y-2">
              {enriched.holders.map((h: any) => (
                <div key={h.rank} className="flex items-center gap-3">
                  <div className="text-gray-600 text-xs w-4">#{h.rank}</div>
                  <div className="text-gray-400 text-xs font-mono truncate w-40">{h.address}</div>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${h.percentage > 20 ? "bg-red-500" : h.percentage > 10 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(h.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-white text-xs w-12 text-right">{h.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Dev Wallet</h2>
          {!enriched.devWallet ? (
            <div className="text-gray-600 text-sm">Dev wallet data unavailable</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Address</div>
                <div className="text-white text-xs font-mono truncate ml-4 max-w-xs">{enriched.devWallet}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Still holding tokens</div>
                <div className={`text-sm font-bold ${enriched.devHolding > 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {enriched.devHolding > 0 ? "YES - watch for dump" : "No holdings found"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Liquidity Lock</h2>
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">LP Lock Status</div>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${
              enriched.lpLock.locked ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
            }`}>
              {enriched.lpLock.locked ? `LOCKED via ${enriched.lpLock.lockerName}` : "NOT LOCKED - devs can rug"}
            </div>
          </div>
        </div>

        {flags.length > 0 ? (
          <div className="bg-red-950 border border-red-800 rounded-2xl p-6 mb-6">
            <h2 className="text-red-400 font-bold text-lg mb-4">Red Flags ({flags.length})</h2>
            <div className="space-y-2">
              {flags.map((flag, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-red-500 shrink-0">!</span>
                  <span className="text-red-200">{flag}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-green-950 border border-green-800 rounded-2xl p-6 mb-6">
            <h2 className="text-green-400 font-bold text-lg">No Red Flags Detected</h2>
            <p className="text-green-200 text-sm mt-1">This token passes all our checks. Always DYOR.</p>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Score Breakdown</h2>
          <div className="space-y-3">
            <ScoreRow label="Liquidity Depth" value={`$${(bd.liquidity / 1000).toFixed(1)}K`} status={bd.liquidity > 500000 ? "good" : bd.liquidity > 100000 ? "mid" : "bad"} note={bd.liquidity > 500000 ? "+20 pts" : bd.liquidity > 100000 ? "+10 pts" : "-20 pts"} />
            <ScoreRow label="Token Age" value={`${bd.ageInDays} days`} status={bd.ageInDays > 180 ? "good" : bd.ageInDays > 30 ? "mid" : "bad"} note={bd.ageInDays > 180 ? "+15 pts" : bd.ageInDays > 30 ? "+8 pts" : bd.ageInDays < 3 ? "-15 pts" : "0 pts"} />
            <ScoreRow label="Volume / Market Cap Ratio" value={`${bd.volumeToMcap}x`} status={bd.volumeToMcap > 5 ? "bad" : bd.volumeToMcap > 2 ? "mid" : "good"} note={bd.volumeToMcap > 5 ? "-25 pts (wash signal)" : bd.volumeToMcap > 2 ? "-10 pts" : "0 pts"} />
            <ScoreRow label="24h Transactions" value={`${bd.txns} (${bd.buys}B / ${bd.sells}S)`} status={bd.txns > 200 ? "good" : bd.txns > 10 ? "mid" : "bad"} note={bd.txns > 200 ? "+10 pts" : bd.txns < 10 ? "-10 pts" : "0 pts"} />
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <WatchlistButton
            pairAddress={address}
            tokenSymbol={token.baseToken?.symbol ?? ""}
            tokenName={token.baseToken?.name ?? ""}
            chainId={token.chainId ?? ""}
            trustScore={trust}
          />
          <a href={token.url ?? "#"} target="_blank" className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-all">
            View on DexScreener
          </a>
        </div>

      </div>
    </main>
  );
}

function ScoreRow({ label, value, status, note }: { label: string; value: string; status: "good" | "mid" | "bad"; note: string }) {
  const color = status === "good" ? "text-green-400" : status === "mid" ? "text-yellow-400" : "text-red-400";
  const icon = status === "good" ? "[+]" : status === "mid" ? "[~]" : "[-]";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800">
      <div className="text-gray-400 text-sm">{icon} {label}</div>
      <div className="flex items-center gap-4">
        <div className="text-white text-sm font-mono">{value}</div>
        <div className={`text-xs font-bold w-36 text-right ${color}`}>{note}</div>
      </div>
    </div>
  );
}