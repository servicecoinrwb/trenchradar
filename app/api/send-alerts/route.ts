import { supabase } from "../../supabase";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { pair_address, token_symbol, trust_score } = body;

  const { data: watchers } = await supabase
    .from("watchlist")
    .select("*")
    .eq("pair_address", pair_address);

  if (!watchers || watchers.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const watcher of watchers) {
    if (trust_score <= watcher.alert_threshold) {
      await resend.emails.send({
        from: "TrenchRadar <alerts@trenchradar.com>",
        to: watcher.email,
        subject: `Alert: ${token_symbol} trust score dropped to ${trust_score}`,
        html: `
          <div style="background:#0a0a0a;color:#fff;padding:32px;font-family:monospace;">
            <h1 style="color:#ef4444;">TrenchRadar Alert</h1>
            <p><strong>${token_symbol}</strong> trust score has dropped to <strong style="color:#ef4444;">${trust_score}</strong></p>
            <p>Your alert threshold was set at ${watcher.alert_threshold}.</p>
            <p style="color:#6b7280;">This may indicate increasing manipulation risk. Review the token before making any decisions.</p>
            <a href="https://trenchradar.com/token/${pair_address}" style="display:inline-block;margin-top:16px;background:#22c55e;color:#000;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;">
              View on TrenchRadar
            </a>
          </div>
        `,
      });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}