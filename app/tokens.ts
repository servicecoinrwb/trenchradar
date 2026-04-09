export async function getTopTokens(chain: string = "all") {
  const boostRes = await fetch(
    "https://api.dexscreener.com/token-boosts/top/v1",
    { next: { revalidate: 60 } }
  );
  const boosts = await boostRes.json();

  const filtered = chain === "all"
    ? boosts
    : boosts.filter((t: any) => t.chainId === chain);

  const top = filtered.slice(0, 20);
  if (top.length === 0) return [];

  const addresses = top.map((t: any) => t.tokenAddress).join(",");
  const pairRes = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
    { next: { revalidate: 60 } }
  );
  const pairData = await pairRes.json();
  const pairs = pairData.pairs ?? [];

  const seen = new Set();
  const result = [];
  for (const pair of pairs) {
    const addr = pair.baseToken?.address;
    if (!seen.has(addr)) {
      seen.add(addr);
      result.push(pair);
    }
    if (result.length >= 20) break;
  }

  return result;
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