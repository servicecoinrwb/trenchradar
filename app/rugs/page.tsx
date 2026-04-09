import { supabase } from "../supabase";

export default async function RugLeaderboardPage() {
  const { data: reports } = await supabase
    .from("red_flag_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: rugs } = await supabase
    .from("rug_leaderboard")
    .select("*")
    .order("confirmed_at", { ascending: false })
    .limit(20);

  // Group reports by pair address
  const reportsByPair: Record<string, any[]> = {};
  for (const r of reports ?? []) {
    if (!reportsByPair[r.pair_address]) reportsByPair[r.pair_address] = [];
    reportsByPair[r.pair_address].push(r);
  }

  const topReported = Object.entries(reportsByPair)
    .map(([addr, reps]) => ({
      pair_address: addr,
      token_symbol: reps[0].token_symbol ?? "???",
      chain_id: reps[0].chain_id ?? "",
      report_count: reps.length,
      types: [...new Set(reps.map((r) => r.report_type))],
      latest: reps[0].created_at,
    }))
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 20);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        <a href="/" className="text-gray-500 text-sm hover:text-green-400 transition-all mb-6 inline-block">
          Back to rankings
        </a>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-400">Rug Radar</h1>
            <p className="text-gray-400 text-sm mt-1">Community-reported manipulation and confirmed rugs.</p>
          </div>
          
            <a href="/report" className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
            Report a Token
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{reports?.length ?? 0}</div>
            <div className="text-gray-400 text-xs mt-1">Total Reports</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{topReported.length}</div>
            <div className="text-gray-400 text-xs mt-1">Tokens Flagged</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{rugs?.length ?? 0}</div>
            <div className="text-gray-400 text-xs mt-1">Confirmed Rugs</div>
          </div>
        </div>

        {/* Most Reported */}
        <div className="mb-10">
          <h2 className="text-white font-bold text-xl mb-4">Most Reported Tokens</h2>
          {topReported.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-600">
              No reports yet. Be the first to report a suspicious token.
            </div>
          ) : (
            <div className="space-y-2">
              {topReported.map((t, i) => (
                
                  key={t.pair_address}
                  href={`/token/${t.pair_address}`}
                  className="grid grid-cols-5 items-center bg-gray-900 border border-gray-800 hover:border-red-800 rounded-xl px-4 py-4 transition-all"
                >
                  <div className="text-gray-500 font-mono">#{i + 1}</div>
                  <div>
                    <div className="font-bold text-white">{t.token_symbol}</div>
                    <div className="text-gray-600 text-xs">{t.chain_id}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.types.slice(0, 2).map((type: string) => (
                      <span key={type} className="text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-lg">{t.report_count}</div>
                    <div className="text-gray-600 text-xs">reports</div>
                  </div>
                  <div className="text-gray-600 text-xs text-right">
                    {new Date(t.latest).toLocaleDateString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Rugs */}
        <div>
          <h2 className="text-white font-bold text-xl mb-4">Confirmed Rugs</h2>
          {!rugs || rugs.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-gray-600 mb-2">No confirmed rugs yet.</div>
              <div className="text-gray-700 text-xs">When a token TrenchRadar flagged turns out to be a rug, it appears here.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {rugs.map((rug) => (
                <div key={rug.id} className="grid grid-cols-5 items-center bg-red-950 border border-red-900 rounded-xl px-4 py-4">
                  <div>
                    <div className="font-bold text-white">{rug.token_symbol}</div>
                    <div className="text-gray-500 text-xs">{rug.chain_id}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Peak Score</div>
                    <div className="text-yellow-400 font-bold">{rug.peak_trust_score}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Final Score</div>
                    <div className="text-red-400 font-bold">{rug.final_trust_score}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Price Change</div>
                    <div className="text-red-400 font-bold">{rug.price_change_pct}%</div>
                  </div>
                  <div className="text-gray-600 text-xs text-right">
                    {new Date(rug.confirmed_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}