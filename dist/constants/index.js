"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OWNER_KEYPAIR = exports.WS_PORT = exports.COMMITMENT = exports.PROGRAM_ID = exports.RPC_URL = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.RPC_URL = "https://devnet.helius-rpc.com/?api-key=5163c3d1-8082-442e-8a15-c27bff3cfabb";
exports.PROGRAM_ID = "DVYGTDbAJVTaXyUksSwAwZr3rw5HmKZsATm6EmSenQAq";
exports.COMMITMENT = "processed";
exports.WS_PORT = (process.env.PORT || 8080);
exports.OWNER_KEYPAIR = web3_js_1.Keypair.fromSecretKey(Uint8Array.from([
    1, 60, 46, 125, 82, 22, 178, 15, 93, 247, 249, 207, 76, 156, 177, 42, 124,
    17, 225, 67, 204, 111, 68, 38, 71, 16, 206, 114, 165, 219, 70, 72, 134, 112,
    118, 222, 227, 101, 128, 158, 70, 17, 179, 29, 31, 208, 236, 211, 12, 89,
    41, 84, 52, 209, 127, 51, 144, 164, 103, 219, 20, 253, 3, 158,
]));
