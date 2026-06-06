"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Program, AnchorProvider } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { IDL } from "@/lib/idl";
import { PROGRAM_ID, USDC_MINT } from "@/lib/constants";
import { getMemberListPDA, getVaultPDA } from "@/lib/pdas";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

function JoinCircleInner() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const searchParams = useSearchParams();
  const circleAddress = searchParams.get("circle");

  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!connected) router.push("/"); }, [connected]);

  useEffect(() => {
    if (!publicKey || !circleAddress) return;
    fetchCircle();
  }, [publicKey, circleAddress]);

  const fetchCircle = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions || !circleAddress) return;
    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const program = new Program(IDL as any, PROGRAM_ID, provider);
      const circlePDA = new PublicKey(circleAddress);
      const circleAccount = await (program.account as any).circle.fetch(circlePDA);
      setCircle({
        address: circleAddress,
        organizer: circleAccount.organizer.toString(),
        contributionAmount: circleAccount.contributionAmount.toNumber() / 1_000_000,
        maxMembers: circleAccount.maxMembers,
        memberCount: circleAccount.memberCount,
        intervalDays: circleAccount.intervalDays,
        isActive: circleAccount.isActive,
      });
    } catch (e) {
      setError("Circle not found. Check the link.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions || !circleAddress) return;
    setJoining(true);
    setError("");
    setSuccess("");

    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const program = new Program(IDL as any, PROGRAM_ID, provider);
      const circlePDA = new PublicKey(circleAddress);
      const [memberListPDA] = getMemberListPDA(circlePDA);
      const [vaultPDA] = getVaultPDA(circlePDA);
      const memberUsdcAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);

      const tx = await program.methods
        .joinCircle()
        .accounts({
          circle: circlePDA,
          memberList: memberListPDA,
          member: publicKey,
          memberUsdcAccount,
          circleVault: vaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess(`Joined successfully! TX: ${tx.slice(0, 8)}...`);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to join. Check console.");
    } finally {
      setJoining(false);
    }
  };

  const collateral = circle ? (circle.contributionAmount * circle.maxMembers * 0.1).toFixed(2) : "0";

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

      <div className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 text-sm mb-6 hover:text-white transition cursor-pointer"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-black mb-2">Join a Circle</h1>
        <p className="text-gray-500 mb-8">Review the circle details and join with your collateral.</p>

        {loading ? (
          <div className="text-center py-20 text-gray-600 animate-pulse">Loading circle...</div>
        ) : error && !circle ? (
          <div className="text-center py-20 text-red-400">{error}</div>
        ) : circle ? (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900 border border-green-500/20 rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-green-400 font-bold text-sm uppercase tracking-widest">Circle Details</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Contribution per round</span>
                <span className="font-bold">{circle.contributionAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Members</span>
                <span className="font-bold">{circle.memberCount}/{circle.maxMembers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Interval</span>
                <span className="font-bold">{circle.intervalDays} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total pool per round</span>
                <span className="font-bold text-green-400">{(circle.contributionAmount * circle.maxMembers).toFixed(2)} USDC</span>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4">
              <p className="text-yellow-400 text-sm font-bold mb-1">Collateral Required</p>
              <p className="text-gray-400 text-xs">
                You need to lock <span className="text-white font-bold">{collateral} USDC</span> as collateral to join.
                This is 10% of the total pool and is returned when the circle completes.
              </p>
            </div>

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
              onClick={handleJoin}
              disabled={joining || circle.isActive || circle.memberCount >= circle.maxMembers}
              className="bg-green-500 text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-green-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Joining..." : `Join Circle — Lock ${collateral} USDC`}
            </button>

            <p className="text-gray-600 text-xs text-center">
              By joining you agree to contribute {circle.contributionAmount} USDC every {circle.intervalDays} days.
            </p>
          </div>
        ) : null}
      </div>

      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-800">
        EsusuX — Decentralized Rotating Savings Protocol on Solana
      </footer>
    </main>
  );
}

export default function JoinCircle() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <JoinCircleInner />
    </Suspense>
  );
}
