"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSearch() {
    const val = input.trim();
    if (!val) return;
    setLoading(true);
    setError("");

    try {
      // Try fetching as pair address across all chains
      const chains = ["solana", "ethereum", "base", "arbitrum", "bsc"];
      for (const chain of chains) {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/pairs/${chain}/${val}`
        );
        const data = await res.json();
        if (data?.pair?.pairAddress) {
          router.push(`/token/${data.pair.pairAddress}`);
          return;
        }
      }

      // Try fetching as token address
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${val}`
      );
      const data = await res.json();
      if (data?.pairs?.length > 0) {
        // Use highest liquidity pair
        const best = data.pairs.sort((a: any, b: any) =>
          (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
        )[0];
        router.push(`/token/${best.pairAddress}`);
        return;
      }

      setError("No token found for that address.");
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Paste any pair or token address to look up..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-600"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-5 py-2 rounded-xl transition-all text-sm"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>
      {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
    </div>
  );
}