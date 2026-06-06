"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <span className="text-xl font-bold text-green-400">EsusuX</span>
        <WalletMultiButton className="!bg-green-500 !text-black !font-bold !rounded-xl" />
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-8">
        <div className="inline-block bg-green-900/30 border border-green-500/30 rounded-full px-4 py-1 text-green-400 text-sm">
          Built on Solana Devnet
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-tight"></h1>