import { supabase } from "../supabase";
import { redirect } from "next/navigation";

async function generateKey(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  if (!email) return;

  const key = "tr_" + crypto.randomUUID().replace(/-/g, "");

  await supabase.from("api_keys").insert({
    key,
    email,
    plan: "free",
  });

  redirect(`/api-access/success?key=${key}`);
}

export default function ApiAccessPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">

        <a href="/" className="text-gray-500 text-sm hover:text-green-400 transition-all mb-8 inline-block">
          Back to rankings
        </a>

        <h1 className="text-4xl font-bold text-green-400 mb-2">TrenchRadar API</h1>
        <p className="text-gray-400 mb-8">Query trust scores programmatically. Free tier includes 100 requests/day.</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-green-400 font-bold text-lg mb-1">Free</div>
            <div className="text-3xl font-bold text-white mb-3">$0</div>
            <div className="text-gray-400 text-sm space-y-1">
              <div>100 requests / day</div>
              <div>Full ranked list</div>
              <div>Single token lookup</div>
              <div>Trust score + breakdown</div>
            </div>
          </div>
          <div className="bg-gray-900 border border-green-800 rounded-xl p-5">
            <div className="text-yellow-400 font-bold text-lg mb-1">Pro</div>
            <div className="text-3xl font-bold text-white mb-3">Coming Soon</div>
            <div className="text-gray-400 text-sm space-y-1">
              <div>10,000 requests / day</div>
              <div>Holder concentration data</div>
              <div>Score history</div>
              <div>Webhook alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-4">Get your free API key</h2>
          <form action={generateKey} className="flex gap-3">
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-all"
            >
              Generate Key
            </button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Endpoints</h2>
          <div className="space-y-6">

            <div>
              <div className="text-green-400 text-sm font-bold mb-2">GET /api/score</div>
              <div className="text-gray-400 text-sm mb-3">Returns full ranked token list sorted by trust score</div>
              <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
                GET /api/score?api_key=YOUR_KEY&chain=all
              </div>
            </div>

            <div>
              <div className="text-green-400 text-sm font-bold mb-2">GET /api/score?address=</div>
              <div className="text-gray-400 text-sm mb-3">Returns trust score for a specific pair address</div>
              <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
                GET /api/score?api_key=YOUR_KEY&address=PAIR_ADDRESS
              </div>
            </div>

            <div>
              <div className="text-green-400 text-sm font-bold mb-2">Example Response</div>
              <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-gray-300">
                {`{
  "success": true,
  "token": {
    "symbol": "LOL",
    "trustScore": 70,
    "washRisk": "LOW",
    "priceUsd": "0.007462",
    "liquidity": 371300,
    "age": 21
  }
}`}
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}