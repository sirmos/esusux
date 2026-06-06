import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function getCirclePDA(organizerPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("circle"), organizerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function getMemberListPDA(circlePubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("members"), circlePubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function getVaultPDA(circlePubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), circlePubkey.toBuffer()],
    PROGRAM_ID
  );
}
