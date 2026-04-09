export default function LandingPage() {
  return (
    <main style={{ background: "#0a0d12", color: "#fff", fontFamily: "monospace", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #1a2030" }}>
        <div style={{ color: "#22c55e", fontSize: "20px", fontWeight: "bold" }}>TrenchRadar</div>
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="/app" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}>Rankings</a>
          <a href="/rugs" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}>Rug Radar</a>
          <a href="/api-access" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}>API</a>
          <a href="/report" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}>Report Token</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 40px 60px" }}>
        <div style={{ display: "inline-block", background: "#052e16", border: "1px solid #166534", color: "#22c55e", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", marginBottom: "24px" }}>
          Free — no signup required
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "bold", lineHeight: 1.1, marginBottom: "20px" }}>
          Token rankings with<br />
          <span style={{ color: "#22c55e" }}>no bullshit</span>
        </h1>
        <p style={{ color: "#6b7280", fontSize: "16px", maxWidth: "560px", margin: "0 auto 36px", lineHeight: 1.6 }}>
          DexScreener ranks tokens by who paid to boost. We rank by trust. Wash trading detection, holder concentration, LP lock status — explained in plain English.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/app" style={{ background: "#22c55e", color: "#000", fontWeight: "bold", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontFamily: "monospace" }}>
            View live rankings
          </a>
          <a href="/api-access" style={{ border: "1px solid #22c55e", color: "#22c55e", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontFamily: "monospace" }}>
            Get API access
          </a>
        </div>
      </div>

      {/* Demo table */}
      <div style={{ maxWidth: "920px", margin: "0 auto 60px", padding: "0 40px" }}>
        <div style={{ background: "#0f1117", border: "1px solid #1a2030", borderRadius: "16px", padding: "24px" }}>
          <div style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "grid", gridTemplateColumns: "40px 1fr 100px 100px 80px 80px 90px", gap: "8px", padding: "0 16px" }}>
            <span>Rank</span><span>Token</span><span>Price</span><span>Liquidity</span><span>Age</span><span>Wash Risk</span><span>Trust Score</span>
          </div>
          {[
            { rank: 1, symbol: "Buttcoin", price: "$0.01039", liq: "$542K", age: "90d", risk: "LOW", score: 88, riskColor: "#22c55e", scoreColor: "#22c55e", hot: "" },
            { rank: 2, symbol: "MOLTING", price: "$0.00085", liq: "$81K", age: "68d", risk: "LOW", score: 68, riskColor: "#22c55e", scoreColor: "#eab308", hot: "" },
            { rank: 14, symbol: "Tortellini  +953% today", price: "$0.00035", liq: "$52K", age: "0d", risk: "HIGH", score: 20, riskColor: "#ef4444", scoreColor: "#ef4444", hot: "rug" },
          ].map((t) => (
            <div key={t.rank} style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px 100px 80px 80px 90px", alignItems: "center", padding: "12px 16px", borderRadius: "10px", marginBottom: "8px", background: t.hot ? "#0d0404" : "#070a0e", border: `1px solid ${t.hot ? "#7f1d1d" : "#1a2030"}`, fontSize: "13px", gap: "8px" }}>
              <span style={{ color: "#4b5563" }}>#{t.rank}</span>
              <span style={{ fontWeight: "bold" }}>{t.symbol}</span>
              <span style={{ fontFamily: "monospace", color: "#fff" }}>{t.price}</span>
              <span style={{ color: "#fff" }}>{t.liq}</span>
              <span style={{ color: "#9ca3af" }}>{t.age}</span>
              <span style={{ color: t.riskColor, fontWeight: "bold" }}>{t.risk}</span>
              <span style={{ color: t.scoreColor, fontWeight: "bold", fontSize: "20px" }}>{t.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", padding: "0 40px 60px", maxWidth: "1000px", margin: "0 auto" }}>
        {[
          { icon: "🔍", title: "Wash trading detection", desc: "Volume/market cap ratio analysis catches fake activity that inflates rankings on other platforms." },
          { icon: "👥", title: "Holder concentration", desc: "Real on-chain data shows if top 5 wallets control the supply — the biggest rug pull signal." },
          { icon: "🔒", title: "LP lock checker", desc: "Know instantly if liquidity is locked or if devs can pull funds at any moment." },
          { icon: "⚡", title: "Red flags in plain English", desc: "No jargon. 'Price pumped 953% in 24h — dump usually follows' says more than a number." },
          { icon: "📡", title: "Community rug radar", desc: "Submit evidence of manipulation. Most-reported tokens get flagged across the platform." },
          { icon: "🛠", title: "Free API access", desc: "Query trust scores programmatically. 100 req/day free. Build bots, alerts, dashboards." },
        ].map((f) => (
          <div key={f.title} style={{ background: "#0f1117", border: "1px solid #1a2030", borderRadius: "16px", padding: "24px" }}>
            <div style={{ fontSize: "24px", marginBottom: "14px" }}>{f.icon}</div>
            <h3 style={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>{f.title}</h3>
            <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "60px 40px", borderTop: "1px solid #1a2030" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "12px" }}>Start using TrenchRadar</h2>
        <p style={{ color: "#6b7280", marginBottom: "28px" }}>Free, no signup, no ads. Just better signal.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/app" style={{ background: "#22c55e", color: "#000", fontWeight: "bold", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontFamily: "monospace" }}>
            Open rankings
          </a>
          <a href="https://chrome.google.com/webstore" target="_blank" style={{ border: "1px solid #22c55e", color: "#22c55e", padding: "14px 28px", borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontFamily: "monospace" }}>
            Install Chrome extension
          </a>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0f1117", border: "1px solid #1a2030", borderRadius: "10px", padding: "12px 20px", fontSize: "13px", color: "#9ca3af", marginTop: "16px" }}>
          Overlays trust scores directly on DexScreener — no tab switching
        </div>
      </div>

    </main>
  );
}