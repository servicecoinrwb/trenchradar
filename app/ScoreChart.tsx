"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type HistoryPoint = {
  recorded_at: string;
  trust_score: number;
};

export default function ScoreChart({ pairAddress }: { pairAddress: string }) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    supabase
      .from("score_history")
      .select("recorded_at, trust_score")
      .eq("pair_address", pairAddress)
      .order("recorded_at", { ascending: true })
      .limit(30)
      .then(({ data }) => {
        if (data) setHistory(data);
      });
  }, [pairAddress]);

  if (history.length < 2) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-2">Score History</h2>
        <p className="text-gray-600 text-sm">Not enough data yet — check back after a few visits. Score snapshots are recorded each time this token is viewed.</p>
      </div>
    );
  }

  const max = 100;
  const width = 600;
  const height = 120;
  const pad = 16;

  const points = history.map((h, i) => {
    const x = pad + (i / (history.length - 1)) * (width - pad * 2);
    const y = height - pad - ((h.trust_score / max) * (height - pad * 2));
    return `${x},${y}`;
  });

  const latest = history[history.length - 1].trust_score;
  const earliest = history[0].trust_score;
  const trend = latest - earliest;
  const trendColor = trend >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">Score History</h2>
        <div className={`text-sm font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          {trend >= 0 ? "+" : ""}{trend} pts since first seen
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 120 }}>
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
        />
        {history.map((h, i) => {
          const x = pad + (i / (history.length - 1)) * (width - pad * 2);
          const y = height - pad - ((h.trust_score / max) * (height - pad * 2));
          return (
            <circle key={i} cx={x} cy={y} r="3" fill={trendColor} />
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{new Date(history[0].recorded_at).toLocaleDateString()}</span>
        <span>{new Date(history[history.length - 1].recorded_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}