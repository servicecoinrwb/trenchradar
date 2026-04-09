"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [input, setInput] = useState("");
  const router = useRouter();

  function handleSearch() {
    const val = input.trim();
    if (!val) return;
    router.push(`/token/${val}`);
  }

  return (
    <div className="flex gap-2 mb-6">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Paste any pair address to look up..."
        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-600"
      />
      <button
        onClick={handleSearch}
        className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-xl transition-all text-sm"
      >
        Search
      </button>
    </div>
  );
}