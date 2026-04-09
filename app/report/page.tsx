"use client";
import { useState } from "react";
import { supabase } from "../supabase";

const REPORT_TYPES = [
  "Wash Trading",
  "Coordinated Pump",
  "Rug Pull in Progress",
  "Dev Wallet Dumping",
  "Fake Volume",
  "Honeypot",
  "Liquidity Pulled",
  "Other Manipulation",
];

export default function ReportPage() {
  const [pairAddress, setPairAddress] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [evidence, setEvidence] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!pairAddress || !evidence) {
      setError("Pair address and evidence are required.");
      return;
    }
    setLoading(true);
    setError("");

    // Try to auto-fetch token symbol if not provided
    let symbol = tokenSymbol;
    let chainId = "";
    if (!symbol) {
      try {
        const chains = ["solana", "ethereum", "base", "arbitrum"];
        for (const c of chains) {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${c}/${pairAddress}`);
          const data = await res.json();
          if (data?.pair) {
            symbol = data.pair.baseToken?.symbol ?? "";
            chainId = data.pair.chainId ?? "";
            break;
          }
        }
      } catch {}
    }

    const { error: err } = await supabase.from("red_flag_reports").insert({
      pair_address: pairAddress.trim(),
      token_symbol: symbol,
      chain_id: chainId,
      report_type: reportType,
      evidence: evidence.trim(),
      reporter_email: email.trim() || null,
    });

    setLoading(false);
    if (err) {
      setError("Failed to submit. Try again.");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-white mb-2">Report Submitted</h1>
          <p className="text-gray-400 text-sm mb-6">Thanks for helping keep the community safe. Our algorithm will factor in community reports.</p>
          <div className="flex gap-3 justify-center">
            <a href="/rugs" className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-xl text-sm transition-all">View Rug Leaderboard</a>
            <a href="/" className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-xl text-sm transition-all">Back to Rankings</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">

        <a href="/" className="text-gray-500 text-sm hover:text-green-400 transition-all mb-6 inline-block">
          Back to rankings
        </a>

        <h1 className="text-3xl font-bold text-red-400 mb-2">Report Manipulation</h1>
        <p className="text-gray-400 text-sm mb-8">Seen a wash trade, pump, or rug? Submit evidence and help protect the community. Top reported tokens get flagged in our rankings.</p>

        <div className="space-y-4">

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">Token Details</h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs uppercase mb-1 block">Pair Address *</label>
                <input
                  type="text"
                  value={pairAddress}
                  onChange={(e) => setPairAddress(e.target.value)}
                  placeholder="0x... or base58..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase mb-1 block">Token Symbol (optional — we'll look it up)</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  placeholder="e.g. BONZAI"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">Manipulation Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-3 py-2 rounded-xl text-sm text-left transition-all border ${
                    reportType === type
                      ? "bg-red-900 border-red-600 text-red-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">Evidence *</h2>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe what you observed. Include transaction hashes, wallet addresses, timestamps, or links to evidence if you have them."
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-600 resize-none"
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-1">Your Email (optional)</h2>
            <p className="text-gray-500 text-xs mb-3">We'll notify you if the report leads to a confirmed rug.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-600"
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>

        </div>
      </div>
    </main>
  );
}