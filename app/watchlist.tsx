"use client";
import { useState } from "react";
import { supabase } from "./supabase";

export default function WatchlistButton({
  pairAddress,
  tokenSymbol,
  tokenName,
  chainId,
  trustScore,
}: {
  pairAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: string;
  trustScore: number;
}) {
  const [watching, setWatching] = useState(false);
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState(40);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleWatch() {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("watchlist").insert({
      pair_address: pairAddress,
      token_symbol: tokenSymbol,
      token_name: tokenName,
      chain_id: chainId,
      email,
      alert_threshold: threshold,
    });
    setLoading(false);
    if (!error) {
      setSaved(true);
      setWatching(true);
      setShowForm(false);
    }
  }

  if (saved) {
    return (
      <div className="bg-green-950 border border-green-800 rounded-xl px-5 py-3 text-green-400 text-sm font-bold">
        Watching {tokenSymbol} — alert set below {threshold}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-white text-sm font-bold">Set up alert for {tokenSymbol}</div>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-600"
        />
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-xs">Alert when trust score drops below</span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm"
          >
            {[20, 30, 40, 50, 60, 70].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleWatch}
            disabled={loading || !email}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg text-sm transition-all"
          >
            {loading ? "Saving..." : "Save Alert"}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
    >
      + Watch Token
    </button>
  );
}