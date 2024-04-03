"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.airdropToken = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const spl = __importStar(require("@solana/spl-token"));
const helpers_1 = require("./helpers");
function airdropToken(_a) {
    return __awaiter(this, arguments, void 0, function* ({ receiverPk, ownerKp, connection, mint, amount, }) {
        try {
            const wallet = new anchor.Wallet(ownerKp);
            const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
            const receiverTokenAccount = yield spl.getAssociatedTokenAddress(new anchor.web3.PublicKey(mint), receiverPk, false);
            if ((yield connection.getAccountInfo(receiverTokenAccount)) == null) {
                console.log("ATA not found, creating one...");
                yield (0, helpers_1.createAssociatedTokenAccount)(provider, new anchor.web3.PublicKey(mint), receiverTokenAccount, receiverPk);
                console.log("✅ ATA created for ", receiverPk.toString());
            }
            yield (0, helpers_1.mintTo)(provider, new anchor.web3.PublicKey(mint), receiverTokenAccount, BigInt(amount.toString()));
            console.log("✅ Tokens minted successfully to ", receiverTokenAccount.toString());
            // return receiverTokenAccount;
        }
        catch (err) {
            console.log("Something went wrong while airdropping coin token.");
            console.log(err);
        }
    });
}
exports.airdropToken = airdropToken;
