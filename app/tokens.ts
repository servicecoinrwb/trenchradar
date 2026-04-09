export async function getTopTokens(chain: string = "all") {
  try {
    let pairs: any[] = [];

    const chains = chain === "all"
      ? ["solana", "ethereum", "base", "arbitrum"]
      : [chain];

    const results = await Promise.all(
      chains.map(async (c) => {
        try {
          const res = await fetch(
            `https://api.dexscreener.com/token-profiles/latest/v1`,
            { next: { revalidate: 60 } }
          );
          const data = await res.json();
          const filtered = data.filter((t: any) => t.chainId === c);
          const addresses = filtered.slice(0, 30).map((t: any) => t.tokenAddress).join(",");
          if (!addresses) return [];

          const pairRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
            { next: { revalidate: 60 } }
          );
          const pairData = await pairRes.json();
          return pairData.pairs ?? [];
        } catch {
          return [];
        }
      })
    );

    pairs = results.flat();

    // Filter: must have real activity
    pairs = pairs.filter(
      (p: any) =>
        p.liquidity?.usd > 5000 &&
        p.volume?.h24 > 500 &&
        (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0) > 5
    );

    // Deduplicate
    const seen = new Set();
    const deduped = [];
    for (const pair of pairs) {
      if (!seen.has(pair.pairAddress)) {
        seen.add(pair.pairAddress);
        deduped.push(pair);
      }
    }

    // Score and sort
    const scored = deduped
      .map((p: any) => ({ pair: p, score: scoreTrust(p) }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 25)
      .map((s: any) => s.pair);

    return scored;
  } catch {
    return [];
  }
}

export function scoreTrust(token: any) {
  let score = 50;

  const liquidity = token.liquidity?.usd ?? 0;
  if (liquidity > 500000) score += 20;
  else if (liquidity > 100000) score += 10;
  else if (liquidity < 10000) score -= 20;

  const created = token.pairCreatedAt ?? Date.now();
  const ageInDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  if (ageInDays > 180) score += 15;
  else if (ageInDays > 30) score += 8;
  else if (ageInDays < 3) score -= 15;

  const volume24h = token.volume?.h24 ?? 0;
  const mcap = token.marketCap ?? 1;
  const volumeToMcap = volume24h / mcap;
  if (volumeToMcap > 5) score -= 25;
  else if (volumeToMcap > 2) score -= 10;

  const txns = (token.txns?.h24?.buys ?? 0) + (token.txns?.h24?.sells ?? 0);
  if (txns < 10) score -= 10;
  else if (txns > 200) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function washRisk(token: any): "LOW" | "MEDIUM" | "HIGH" {
  const volume24h = token.volume?.h24 ?? 0;
  const mcap = token.marketCap ?? 1;
  const ratio = volume24h / mcap;
  const txns = (token.txns?.h24?.buys ?? 0) + (token.txns?.h24?.sells ?? 0);

  if (ratio > 5 || txns < 5) return "HIGH";
  if (ratio > 2 || txns < 20) return "MEDIUM";
  return "LOW";
}

export function scoreBreakdown(token: any) {
  const liquidity = token.liquidity?.usd ?? 0;
  const created = token.pairCreatedAt ?? Date.now();
  const ageInDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  const volume24h = token.volume?.h24 ?? 0;
  const mcap = token.marketCap ?? 1;
  const volumeToMcap = Number((volume24h / mcap).toFixed(2));
  const txns = (token.txns?.h24?.buys ?? 0) + (token.txns?.h24?.sells ?? 0);
  const priceChange24h = token.priceChange?.h24 ?? 0;

  return {
    liquidity,
    ageInDays,
    volumeToMcap,
    txns,
    priceChange24h,
    buys: token.txns?.h24?.buys ?? 0,
    sells: token.txns?.h24?.sells ?? 0,
    mcap,
    volume24h,
  };
}