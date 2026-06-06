"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { IDL } from "@/lib/idl";
import { PROGRAM_ID } from "@/lib/constants";
import { getCirclePDA } from "@/lib/pdas";

export default function CreateCircle() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState("");
  const [interval, setInterval] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!connected) router.push("/");
  }, [connected]);

  const totalPool = amount && members
    ? (parseFloat(amount) * parseFloat(members)).toFixed(2)
    : "0.00";

  const collateral = amount && members
    ? ((parseFloat(amount) * parseFloat(members)) * 0.1).toFixed(2)
    : "0.00";

  const handleCreate = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, PROGRAM_ID, provider);

      const contributionAmountLamports = new BN(
        parseFloat(amount) * 1_000_000 // USDC has 6 decimals
      );
      const maxMembers = parseInt(members);
      const intervalDays = parseInt(interval);

      const [circlePDA] = getCirclePDA(publicKey);

      const tx = await program.methods
        .createCircle(contributionAmountLamports, maxMembers, intervalDays)
        .accounts({
          circle: circlePDA,
          organizer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess(`Circle created! Transaction: ${tx.slice(0, 8)}...`);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <span
          className="text-xl font-bold text-green-400 cursor-pointer"
          onClick={() => router.push("/")}
        >
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
          <WalletMultiButton />
        </div>
      </nav>

      <div className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 text-sm mb-6 hover:text-white transition cursor-pointer"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-black mb-2">Create a Circle</h1>
        <p className="text-gray-500 mb-8">Set up your rotating savings group on-chain.</p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-300">
              Contribution Amount (USDC per member per round)
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-300">
              Number of Members
            </label>
            <input
              type="number"
              placeholder="e.g. 5"
              min="2"
              max="10"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
            <span className="text-gray-600 text-xs">Minimum 2, maximum 10 (devnet limit)</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-300">
              Payout Interval
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
            >
              <option value="7">Weekly (every 7 days)</option>
              <option value="14">Bi-weekly (every 14 days)</option>
              <option value="30">Monthly (every 30 days)</option>
            </select>
          </div>

          {amount && members && (
            <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-green-400 font-bold text-sm uppercase tracking-widest">Circle Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total pool per round</span>
                <span className="font-bold">{totalPool} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Collateral to join (10%)</span>
                <span className="font-bold text-yellow-400">{collateral} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total duration</span>
                <span className="font-bold">{parseInt(members) * parseInt(interval)} days</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 text-green-400 text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!amount || !members || loading}
            className="bg-green-500 text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-green-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Circle..." : "Create Circle on Solana"}
          </button>

          <p className="text-gray-600 text-xs text-center">
            This will create a smart contract on Solana Devnet. Make sure your wallet is connected.
          </p>
        </div>
      </div>

      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-800">
        EsusuX — Decentralized Rotating Savings Protocol on Solana
      </footer>
    </main>
  );
}