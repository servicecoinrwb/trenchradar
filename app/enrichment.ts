const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// ─── HOLDER CONCENTRATION ───────────────────────────────────────────────────

export async function getSolanaHolders(mintAddress: string) {
  try {
    const res = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenLargestAccounts",
          params: [mintAddress],
        }),
        next: { revalidate: 300 },
      }
    );
    const data = await res.json();
    const accounts = data?.result?.value ?? [];

    const totalSupplyRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "getTokenSupply",
          params: [mintAddress],
        }),
        next: { revalidate: 300 },
      }
    );
    const supplyData = await totalSupplyRes.json();
    const totalSupply = Number(supplyData?.result?.value?.uiAmount ?? 0);

    return accounts.slice(0, 10).map((acc: any, i: number) => ({
      rank: i + 1,
      address: acc.address,
      amount: Number(acc.uiAmount ?? 0),
      percentage: totalSupply > 0 ? (Number(acc.uiAmount) / totalSupply) * 100 : 0,
    }));
  } catch {
    return [];
  }
}

export async function getEthereumHolders(tokenAddress: string) {
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=10&apikey=${ETHERSCAN_API_KEY}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    const holders = data?.result ?? [];

    const supplyRes = await fetch(
      `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${tokenAddress}&apikey=${ETHERSCAN_API_KEY}`,
      { next: { revalidate: 300 } }
    );
    const supplyData = await supplyRes.json();
    const totalSupply = Number(supplyData?.result ?? 1);

    return holders.slice(0, 10).map((h: any, i: number) => ({
      rank: i + 1,
      address: h.TokenHolderAddress,
      amount: Number(h.TokenHolderQuantity),
      percentage: (Number(h.TokenHolderQuantity) / totalSupply) * 100,
    }));
  } catch {
    return [];
  }
}

// ─── DEV WALLET ─────────────────────────────────────────────────────────────

export async function getSolanaDevWallet(mintAddress: string) {
  try {
    const res = await fetch(
      `https://api.helius.xyz/v0/tokens/metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAccounts: [mintAddress] }),
        next: { revalidate: 300 },
      }
    );
    const data = await res.json();
    const token = data?.[0];
    const updateAuthority = token?.onChainMetadata?.metadata?.updateAuthority ?? null;
    return updateAuthority;
  } catch {
    return null;
  }
}

export async function getEthereumDevWallet(tokenAddress: string) {
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${tokenAddress}&apikey=${ETHERSCAN_API_KEY}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return data?.result?.[0]?.contractCreator ?? null;
  } catch {
    return null;
  }
}

export async function getDevWalletHolding(
  devWallet: string,
  mintAddress: string,
  chain: string
) {
  try {
    if (chain === "solana") {
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
              devWallet,
              { mint: mintAddress },
              { encoding: "jsonParsed" },
            ],
          }),
          next: { revalidate: 300 },
        }
      );
      const data = await res.json();
      const accounts = data?.result?.value ?? [];
      const balance = accounts?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      return Number(balance);
    } else {
      const res = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${mintAddress}&address=${devWallet}&apikey=${ETHERSCAN_API_KEY}`,
        { next: { revalidate: 300 } }
      );
      const data = await res.json();
      return Number(data?.result ?? 0);
    }
  } catch {
    return 0;
  }
}

// ─── LP LOCK ─────────────────────────────────────────────────────────────────

const KNOWN_LOCKERS_SOL = [
  "reveif4bTmjNb3FqGPrMHCMrFGBNMhBMHRnhCRrWjTd", // Raydium lock
  "7WduLbRfYhTJktjLw5FDEyrqoEv61aTTCuGADMa8ffe", // Fluxbeam
  "LockrWmn6K5twhz3y9w1dQERbmgSaRkfnTeTKbpofwE",  // Streamflow
];

const KNOWN_LOCKERS_ETH = [
  "0x663a5c229c09b049e36dcd11a9ef442b520e00e3", // Unicrypt
  "0x71B5759d73262FBb223956913ecF4ecC51057641", // PinkLock
  "0xdD6B450D8082fA77e18fcA98b97cEae26F58ab8a", // Team.Finance
];

export async function checkLPLock(
  lpAddress: string,
  chain: string
): Promise<{ locked: boolean; lockerName: string | null }> {
  try {
    if (chain === "solana") {
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenLargestAccounts",
            params: [lpAddress],
          }),
          next: { revalidate: 300 },
        }
      );
      const data = await res.json();
      const topHolder = data?.result?.value?.[0]?.address ?? "";
      const isLocked = KNOWN_LOCKERS_SOL.some((l) =>
        topHolder.toLowerCase().includes(l.toLowerCase())
      );
      return { locked: isLocked, lockerName: isLocked ? "Known Locker" : null };
    } else {
      const res = await fetch(
        `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${lpAddress}&page=1&offset=5&apikey=${ETHERSCAN_API_KEY}`,
        { next: { revalidate: 300 } }
      );
      const data = await res.json();
      const holders = data?.result ?? [];
      for (const h of holders) {
        const addr = h.TokenHolderAddress?.toLowerCase();
        const match = KNOWN_LOCKERS_ETH.find((l) => l.toLowerCase() === addr);
        if (match) {
          const names: Record<string, string> = {
            "0x663a5c229c09b049e36dcd11a9ef442b520e00e3": "Unicrypt",
            "0x71b5759d73262fbb223956913ecf4ecc51057641": "PinkLock",
            "0xdd6b450d8082fa77e18fca98b97ceae26f58ab8a": "Team.Finance",
          };
          return { locked: true, lockerName: names[match] ?? "Known Locker" };
        }
      }
      return { locked: false, lockerName: null };
    }
  } catch {
    return { locked: false, lockerName: null };
  }
}

// ─── COMBINED ENRICHMENT ─────────────────────────────────────────────────────

export async function enrichToken(token: any) {
  const chain = token.chainId ?? "solana";
  const mintAddress = token.baseToken?.address ?? "";
  const lpAddress = token.quoteToken?.address ?? "";

  const isSolana = chain === "solana";

  const [holders, devWallet, lpLock] = await Promise.all([
    isSolana
      ? getSolanaHolders(mintAddress)
      : getEthereumHolders(mintAddress),
    isSolana
      ? getSolanaDevWallet(mintAddress)
      : getEthereumDevWallet(mintAddress),
    checkLPLock(lpAddress, chain),
  ]);

  const devHolding = devWallet
    ? await getDevWalletHolding(devWallet, mintAddress, chain)
    : 0;

  const top5Pct = holders
    .slice(0, 5)
    .reduce((sum: number, h: any) => sum + h.percentage, 0);

  return {
    holders,
    top5Pct: Math.round(top5Pct * 10) / 10,
    devWallet,
    devHolding,
    lpLock,
  };
}