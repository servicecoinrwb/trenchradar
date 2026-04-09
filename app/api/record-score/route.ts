import { supabase } from "../../supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { pair_address, trust_score, wash_risk, price_usd, liquidity } = body;

  await supabase.from("score_history").insert({
    pair_address,
    trust_score,
    wash_risk,
    price_usd,
    liquidity,
  });

  return NextResponse.json({ ok: true });
}