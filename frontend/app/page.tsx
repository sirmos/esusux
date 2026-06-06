"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <span className="text-xl font-bold text-green-400">EsusuX</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
            </span>
            <span className="text-yellow-400 text-xs font-mono font-semibold tracking-widest uppercase">Devnet</span>
          </div>
          <WalletMultiButton />
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-8">
        <h1 className="text-5xl md:text-7xl font-black leading-tight">
          EsusuX<br />
          <span className="text-green-400">The future of rotating savings.</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl">
          Rotating savings, reimagined on-chain. Trustless, transparent,
          and unstoppable. No collector can run with your money.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {connected ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-green-500 text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-green-400 transition"
            >
              Go to Dashboard
            </button>
          ) : (
            <WalletMultiButton />
          )}
        </div>
        <div className="grid grid-cols-3 gap-8 mt-8 border-t border-gray-800 pt-8 w-full max-w-lg">
          <div>
            <div className="text-2xl font-bold text-green-400">100%</div>
            <div className="text-gray-500 text-sm">Trustless</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">0%</div>
            <div className="text-gray-500 text-sm">Interest</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">USDC</div>
            <div className="text-gray-500 text-sm">Stablecoin</div>
          </div>
        </div>
      </div>
      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-800">
        EsusuX — Decentralized Rotating Savings Protocol on Solana
      </footer>
    </main>
  );
}
