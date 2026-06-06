"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Program, AnchorProvider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { encodeURL, createQR } from "@solana/pay";
import BigNumber from "bignumber.js";
import { IDL } from "@/lib/idl";
import { PROGRAM_ID, USDC_MINT } from "@/lib/constants";
import { getCirclePDA } from "@/lib/pdas";

export default function PayPage() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!connected) router.push("/"); }, [connected]);

  useEffect(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    fetchCircle();
  }, [publicKey]);

  const fetchCircle = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    try {
      const wallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const program = new Program(IDL as any, PROGRAM_ID, provider);
      const [circlePDA] = getCirclePDA(publicKey);
      const circleAccount = await (program.account as any).circle.fetch(circlePDA);
      setCircle({
        address: circlePDA.toString(),
        contributionAmount: circleAccount.contributionAmount.toNumber() / 1_000_000,
        maxMembers: circleAccount.maxMembers,
        memberCount: circleAccount.memberCount,
        intervalDays: circleAccount.intervalDays,
        isActive: circleAccount.isActive,
      });
    } catch {
      setCircle(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!circle || !qrRef.current) return;
    qrRef.current.innerHTML = "";
    try {
      const url = encodeURL({
        recipient: new PublicKey(circle.address),
        amount: new BigNumber(circle.contributionAmount),
        splToken: USDC_MINT,
        label: "EsusuX Circle Contribution",
        message: `Join EsusuX circle — contribute ${circle.contributionAmount} USDC`,
      });
      const qr = createQR(url, 280, "transparent", "#4ade80");
      qr.append(qrRef.current);
    } catch (e) {
      console.error("QR error", e);
    }
  }, [circle]);

  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/join?circle=${circle?.address}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <h1 className="text-3xl font-black mb-2">Solana Pay QR</h1>
        <p className="text-gray-500 mb-8">Share this QR so members can contribute to your circle.</p>

        {loading ? (
          <div className="text-center py-20 text-gray-600 animate-pulse">Loading circle data...</div>
        ) : !circle ? (
          <div className="text-center py-20 text-gray-600">
            <p>No circle found. Create one first.</p>
            <button onClick={() => router.push("/create")} className="mt-4 text-green-400 underline cursor-pointer">
              Create a Circle
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* QR Code */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4">
              <div ref={qrRef} />
              <p className="text-gray-500 text-xs text-center">
                Scan with any Solana Pay compatible wallet
              </p>
            </div>

            {/* Circle Info */}
            <div className="w-full bg-gray-900 border border-green-500/20 rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-green-400 font-bold text-sm uppercase tracking-widest">Circle Details</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Contribution per member</span>
                <span className="font-bold">{circle.contributionAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Members joined</span>
                <span className="font-bold">{circle.memberCount}/{circle.maxMembers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Interval</span>
                <span className="font-bold">{circle.intervalDays} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${circle.isActive ? "text-green-400" : "text-yellow-400"}`}>
                  {circle.isActive ? "Active" : "Waiting for members"}
                </span>
              </div>
            </div>

            {/* Share Link */}
            <div className="w-full">
              <p className="text-sm text-gray-400 mb-2">Or share this invite link:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm"
                />
                <button
                  onClick={copyLink}
                  className="bg-green-500 text-black font-bold px-4 py-3 rounded-xl hover:bg-green-400 transition cursor-pointer text-sm"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-4 text-gray-600 text-sm border-t border-gray-800">
        EsusuX — Decentralized Rotating Savings Protocol on Solana
      </footer>
    </main>
  );
}