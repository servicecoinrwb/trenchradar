import { NextResponse } from "next/server";
import { supabase } from "../../supabase";
import { getTopTokens, scoreTrust, washRisk, scoreBreakdown } from "../../tokens";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function validateKey(key: string) {
  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key", key)
    .single();

  if (!data) return { valid: false, reason: "Invalid API key" };

  if (data.last_reset !== new Date().toISOString().split("T")[0]) {
    await supabase
      .from("api_keys")
      .update({ requests_today: 0, last_reset: new Date().toISOString().split("T")[0] })
      .eq("key", key);
    data.requests_today = 0;
  }

  const limit = data.plan === "pro" ? 10000 : 100;
  if (data.requests_today >= limit) {
    return { valid: false, reason: `Daily limit of ${limit} requests reached` };
  }

  await supabase
    .from("api_keys")
    .update({ requests_today: data.requests_today + 1 })
    .eq("key", key);

  return { valid: true, plan: data.plan };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("api_key");
  const address = searchParams.get("address");
  const chain = searchParams.get("chain") ?? "all";

  if (!key) {
    return NextResponse.json(
      { error: "Missing api_key. Get one at trenchradar.vercel.app/api-access" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { valid, reason, plan } = await validateKey(key);
  if (!valid) {
    return NextResponse.json({ error: reason }, { status: 403, headers: CORS_HEADERS });
  }

  if (!address) {
    const tokens = await getTopTokens(chain);
    const scored = tokens
      .map((token: any) => ({
        symbol: token.baseToken?.symbol,
        name: token.baseToken?.name,
        address: token.baseToken?.address,
        pairAddress: token.pairAddress,
        chainId: token.chainId,
        priceUsd: token.priceUsd,
        liquidity: token.liquidity?.usd,
        priceChange24h: token.priceChange?.h24,
        trustScore: scoreTrust(token),
        washRisk: washRisk(token),
        age: Math.floor((Date.now() - (token.pairCreatedAt ?? Date.now())) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a: any, b: any) => b.trustScore - a.trustScore);

    return NextResponse.json(
      { success: true, plan, count: scored.length, tokens: scored },
      { headers: CORS_HEADERS }
    );
  }

  const tokens = await getTopTokens(chain);
  const token = tokens.find((t: any) => t.pairAddress === address || t.baseToken?.address === address);

  if (!token) {
    return NextResponse.json(
      { error: "Token not found in current list" },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const bd = scoreBreakdown(token);

  return NextResponse.json(
    {
      success: true,
      plan,
      token: {
        symbol: token.baseToken?.symbol,
        name: token.baseToken?.name,
        address: token.baseToken?.address,
        pairAddress: token.pairAddress,
        chainId: token.chainId,
        priceUsd: token.priceUsd,
        liquidity: bd.liquidity,
        volume24h: bd.volume24h,
        priceChange24h: bd.priceChange24h,
        age: bd.ageInDays,
        trustScore: scoreTrust(token),
        washRisk: washRisk(token),
        breakdown: {
          liquidityScore: bd.liquidity > 500000 ? "+20" : bd.liquidity > 100000 ? "+10" : "-20",
          ageScore: bd.ageInDays > 180 ? "+15" : bd.ageInDays > 30 ? "+8" : bd.ageInDays < 3 ? "-15" : "0",
          volumeScore: bd.volumeToMcap > 5 ? "-25" : bd.volumeToMcap > 2 ? "-10" : "0",
          txnScore: bd.txns > 200 ? "+10" : bd.txns < 10 ? "-10" : "0",
          buys: bd.buys,
          sells: bd.sells,
          volumeToMcap: bd.volumeToMcap,
        },
      },
    },
    { headers: CORS_HEADERS }
  );
}