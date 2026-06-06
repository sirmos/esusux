"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { IDL } from "@/lib/idl";
import { PROGRAM_ID } from "@/lib/constants";
import { getCirclePDA, getMemberListPDA } from "@/lib/pdas";

interface CircleData {
  address: string;
  organizer: string;
  contributionAmount: number;
  maxMembers: number;
  intervalDays: number;
  memberCount: number;
  currentRound: number;
  isActive: boolean;
}

export default function Dashboard() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!connected) router.push("/");
  }, [connected]);

  useEffect(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    fetchCircle();
  }, [publicKey]);

  const fetchCircle = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    setLoading(true);
    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, PROGRAM_ID, provider);
      const [circlePDA] = getCirclePDA(publicKey);
      const circleAccount = await (program.account as any).circle.fetch(circlePDA);
      setCircle({
        address: circlePDA.toString(),
        organizer: circleAccount.organizer.toString(),
        contributionAmount: circleAccount.contributionAmount.toNumber() / 1_000_000,
        maxMembers: circleAccount.maxMembers,
        intervalDays: circleAccount.intervalDays,
        memberCount: circleAccount.memberCount,
        currentRound: circleAccount.currentRound,
        isActive: circleAccount.isActive,
      });
    } catch {
      setCircle(null);
    } finally {
      setLoading(false);
    }
  };

  const shortKey = publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : "";

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <span className="text-xl font-bold text-green-400 cursor-pointer" onClick={() => router.push("/")}>
          EsusuX
        </span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
            </span>
            <span className="text-yellow-400 text-xs font-mono font-semibold tracking-widest uppercase">Devnet</span>
          </div>
          {mounted && <WalletMultiButton />}
        </div>
      </nav>

      <div className="flex-1 px-8 py-10 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black">Your Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Wallet: {shortKey}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/pay")}
              className="bg-gray-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-700 transition cursor-pointer border border-gray-700"
            >
              Share QR ↗
            </button>
            <button
              onClick={() => router.push("/create")}
              className="bg-green-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition cursor-pointer"
            >
              + Create Circle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Circle */}
          <div className="border border-gray-800 rounded-2xl p-6 bg-gray-900/50">
            <h2 className="text-lg font-bold mb-4 text-green-400">My Circle</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                <p className="text-sm animate-pulse">Loading on-chain data...</p>
              </div>
            ) : circle ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${circle.isActive ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {circle.isActive ? "● Active" : "○ Waiting for members"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Contribution</div>
                    <div className="font-bold text-white">{circle.contributionAmount} USDC</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Members</div>
                    <div className="font-bold text-white">{circle.memberCount}/{circle.maxMembers}</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Interval</div>
                    <div className="font-bold text-white">{circle.intervalDays} days</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Round</div>
                    <div className="font-bold text-white">{circle.currentRound}/{circle.maxMembers}</div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <div className="text-gray-500 text-xs mb-1">Total Pool Per Round</div>
                  <div className="font-bold text-green-400 text-lg">
                    {(circle.contributionAmount * circle.maxMembers).toFixed(2)} USDC
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => router.push("/pay")}
                    className="flex-1 bg-gray-700 text-white text-sm font-bold py-2 rounded-xl hover:bg-gray-600 transition cursor-pointer"
                  >
                    Share QR ↗
                  </button>
                  <button
                    onClick={() => router.push(`/join?circle=${circle.address || ""}`)}
                    className="flex-1 bg-green-500 text-black text-sm font-bold py-2 rounded-xl hover:bg-green-400 transition cursor-pointer"
                  >
                    Join Circle
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <div className="text-4xl mb-3">⭕</div>
                <p className="text-sm">You have no active circles yet.</p>
                <button
                  onClick={() => router.push("/create")}
                  className="mt-4 text-green-400 text-sm underline cursor-pointer"
                >
                  Create your first circle →
                </button>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="border border-gray-800 rounded-2xl p-6 bg-gray-900/50">
            <h2 className="text-lg font-bold mb-4 text-green-400">How It Works</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: "1", title: "Create a Circle", desc: "Set contribution amount, number of members and interval" },
                { step: "2", title: "Members Join", desc: "Each member locks 10% collateral to join" },
                { step: "3", title: "Contribute Each Round", desc: "Everyone contributes, the pool goes to that round's recipient" },
                { step: "4", title: "Rotate Until Done", desc: "Every member receives once. Circle closes automatically." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-green-500 text-black font-bold text-sm flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-800">
        EsusuX — Decentralized Rotating Savings Protocol on Solana
      </footer>
    </main>
  );
}