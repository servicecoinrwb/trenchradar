export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-8 text-center">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-white mb-2">API Key Generated</h1>
          <p className="text-gray-400 text-sm mb-6">Save this key — it won't be shown again.</p>

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 font-mono text-green-400 text-sm break-all mb-6">
            {key}
          </div>

          <div className="text-gray-500 text-xs mb-6">
            Free tier: 100 requests/day. Include as ?api_key= in all requests.
          </div>

          <div className="flex gap-3 justify-center">
            <a href="/api-access" className="text-gray-400 hover:text-white text-sm transition-all">
              Back to docs
            </a>
            <a href="/" className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-xl text-sm transition-all">
              Go to rankings
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}