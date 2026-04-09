const CHAIN_PAIRS: Record<string, string[]> = {
  ethereum: [
    "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", // USDC/ETH Uniswap
    "0x11b815efb8f581194ae79006d24e0d814b7697f6", // WETH/USDT
    "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36", // WETH/USDT v3
  ],
  base: [
    "0xd0b53d9277642d899df5c87a3966a349a798f224", // WETH/USDC Base
  ],
  arbitrum: [
    "0xc31e54c7a869b9fcbecc14363cf510d1c41fa443", // WETH/USDC Arb
  ],
};

export async function getTopTokens(chain: string = "all") {
  try {
    const chains = chain === "all"
      ? ["solana", "ethereum", "base", "arbitrum"]
      : [chain];

    const results = await Promise.all(
      chains.map(async (c) => {
        try {
          // Use boosted + profile tokens as seed
          const [boostRes, profileRes] = await Promise.all([
            fetch(`https://api.dexscreener.com/token-boosts/latest/v1`, { next: { revalidate: 120 } }),
            fetch(`https://api.dexscreener.com/token-profiles/latest/v1`, { next: { revalidate: 120 } }),
          ]);

          const boosts = await boostRes.json();
          const profiles = await profileRes.json();

          const combined = [
            ...boosts.filter((t: any) => t.chainId === c),
            ...profiles.filter((t: any) => t.chainId === c),
          ];

          const seen = new Set();
          const unique = combined.filter((t: any) => {
            if (seen.has(t.tokenAddress)) return false;
            seen.add(t.tokenAddress);
            return true;
          });

          if (unique.length === 0) return [];

          const addresses = unique.slice(0, 30).map((t: any) => t.tokenAddress).join(",");
          const pairRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
            { next: { revalidate: 60 } }
          );
          const pairData = await pairRes.json();
          return (pairData.pairs ?? []).filter((p: any) => p.chainId === c);
        } catch {
          return [];
        }
      })
    );

    let pairs = results.flat();

    // Quality filter
    pairs = pairs.filter(
      (p: any) =>
        p.liquidity?.usd > 5000 &&
        p.volume?.h24 > 500 &&
        (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0) > 5
    );

    // Deduplicate
    const seen = new Set();
    const deduped: any[] = [];
    for (const pair of pairs) {
      if (!seen.has(pair.pairAddress)) {
        seen.add(pair.pairAddress);
        deduped.push(pair);
      }
    }

    // Score and sort
    return deduped
      .map((p: any) => ({ pair: p, score: scoreTrust(p) }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 25)
      .map((s: any) => s.pair);

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