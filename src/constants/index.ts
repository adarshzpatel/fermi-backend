import { Commitment, Keypair } from "@solana/web3.js";

export const RPC_URL = "https://devnet.helius-rpc.com/?api-key=5163c3d1-8082-442e-8a15-c27bff3cfabb";
export const PROGRAM_ID = "33ZENzbUfMGwZZYQDCj8DEeBKBqd8LaCKnMfQQnMVGFW";
export const COMMITMENT: Commitment = "processed";
export const WS_PORT = (process.env.PORT || 8080) as number;
export const OWNER_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from([
    1, 60, 46, 125, 82, 22, 178, 15, 93, 247, 249, 207, 76, 156, 177, 42, 124,
    17, 225, 67, 204, 111, 68, 38, 71, 16, 206, 114, 165, 219, 70, 72, 134, 112,
    118, 222, 227, 101, 128, 158, 70, 17, 179, 29, 31, 208, 236, 211, 12, 89,
    41, 84, 52, 209, 127, 51, 144, 164, 103, 219, 20, 253, 3, 158,
  ])
);
