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
exports.fetchTokenBalance = exports.mintTo = exports.createAssociatedTokenAccount = exports.checkMintOfATA = exports.checkOrCreateAssociatedTokenAccount = exports.createMint = exports.createAssociatedTokenAccountIdempotentInstruction = exports.getAssociatedTokenAddress = exports.toUiDecimalsForQuote = exports.QUOTE_DECIMALS = exports.toUiDecimals = exports.toNative = exports.shortenAddress = exports.percentageToDecimal = exports.bpsToDecimal = exports.I64_MAX_BN = exports.U64_MAX_BN = exports.SelfTradeBehavior = exports.OrderType = exports.Side = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
const anchor = __importStar(require("@coral-xyz/anchor"));
const spl = __importStar(require("@solana/spl-token"));
exports.Side = {
    Bid: { bid: {} },
    Ask: { ask: {} },
};
exports.OrderType = {
    Limit: { limit: {} },
    ImmediateOrCancel: { immediateOrCancel: {} },
    PostOnly: { postOnly: {} },
    Market: { market: {} },
    PostOnlySlide: { postOnlySlide: {} },
};
exports.SelfTradeBehavior = {
    DecrementTake: { decrementTake: {} },
    CancelProvide: { cancelProvide: {} },
    AbortTransaction: { abortTransaction: {} },
};
exports.U64_MAX_BN = new anchor_1.BN("18446744073709551615");
exports.I64_MAX_BN = new anchor_1.BN("9223372036854775807").toTwos(64);
function bpsToDecimal(bps) {
    return bps / 10000;
}
exports.bpsToDecimal = bpsToDecimal;
function percentageToDecimal(percentage) {
    return percentage / 100;
}
exports.percentageToDecimal = percentageToDecimal;
function shortenAddress(s) {
    return s.slice(0, 6) + "..." + s.slice(-6);
}
exports.shortenAddress = shortenAddress;
function toNative(uiAmount, decimals) {
    return new anchor_1.BN((uiAmount * Math.pow(10, decimals)).toFixed(0));
}
exports.toNative = toNative;
function toUiDecimals(nativeAmount, decimals) {
    return nativeAmount / Math.pow(10, decimals);
}
exports.toUiDecimals = toUiDecimals;
exports.QUOTE_DECIMALS = 6;
function toUiDecimalsForQuote(nativeAmount) {
    return toUiDecimals(nativeAmount, exports.QUOTE_DECIMALS);
}
exports.toUiDecimalsForQuote = toUiDecimalsForQuote;
/**
 * Get the address of the associated token account for a given mint and owner
 *
 * @param mint                     Token mint account
 * @param owner                    Owner of the new account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Address of the associated token account
 */
function getAssociatedTokenAddress(mint_1, owner_1) {
    return __awaiter(this, arguments, void 0, function* (mint, owner, allowOwnerOffCurve = true, programId = spl_token_1.TOKEN_PROGRAM_ID, associatedTokenProgramId = spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID) {
        if (!allowOwnerOffCurve && !web3_js_1.PublicKey.isOnCurve(owner.toBuffer()))
            throw new Error("TokenOwnerOffCurve!");
        const [address] = yield web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
        return address;
    });
}
exports.getAssociatedTokenAddress = getAssociatedTokenAddress;
function createAssociatedTokenAccountIdempotentInstruction(payer, owner, mint) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = yield getAssociatedTokenAddress(mint, owner);
        return new web3_js_1.TransactionInstruction({
            keys: [
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: account, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: mint, isSigner: false, isWritable: false },
                {
                    pubkey: web3_js_1.SystemProgram.programId,
                    isSigner: false,
                    isWritable: false,
                },
                { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            data: Buffer.from([0x1]),
        });
    });
}
exports.createAssociatedTokenAccountIdempotentInstruction = createAssociatedTokenAccountIdempotentInstruction;
const createMint = (provider, mint, decimal) => __awaiter(void 0, void 0, void 0, function* () {
    // const programId = getDevPgmId();
    const tx = new anchor.web3.Transaction();
    tx.add(anchor.web3.SystemProgram.createAccount({
        programId: spl.TOKEN_PROGRAM_ID,
        // programId: programId,
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: spl.MintLayout.span,
        lamports: yield provider.connection.getMinimumBalanceForRentExemption(spl.MintLayout.span),
    }));
    tx.add(spl.createInitializeMintInstruction(mint.publicKey, decimal, provider.wallet.publicKey, provider.wallet.publicKey));
    yield provider.sendAndConfirm(tx, [mint]);
});
exports.createMint = createMint;
const checkOrCreateAssociatedTokenAccount = (provider, mint, owner) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the ATA for the given mint and owner
    try {
        const ata = yield spl.getAssociatedTokenAddress(mint, owner, true);
        // Check if the ATA already exists
        const accountInfo = yield provider.connection.getAccountInfo(ata);
        if (accountInfo == null) {
            // ATA does not exist, create it
            console.log("Creating Associated Token Account for user...");
            yield (0, exports.createAssociatedTokenAccount)(provider, mint, ata, owner);
            console.log("Associated Token Account created successfully.");
        }
        else {
            // ATA already exists
            console.log("Associated Token Account already exists.");
        }
        return ata.toBase58();
    }
    catch (err) {
        console.error('Error in checkOrCreateAta', err);
        throw err;
    }
});
exports.checkOrCreateAssociatedTokenAccount = checkOrCreateAssociatedTokenAccount;
function checkMintOfATA(connection, ataAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ataInfo = yield connection.getAccountInfo(new web3_js_1.PublicKey(ataAddress));
            if (ataInfo === null) {
                throw new Error("Account not found");
            }
            // The mint address is the first 32 bytes of the account data
            const mintAddress = new web3_js_1.PublicKey(ataInfo.data.slice(0, 32));
            return mintAddress.toBase58();
        }
        catch (error) {
            console.error("Error in checkMintOfATA:", error);
            throw error;
        }
    });
}
exports.checkMintOfATA = checkMintOfATA;
const createAssociatedTokenAccount = (provider, mint, ata, owner) => __awaiter(void 0, void 0, void 0, function* () {
    const tx = new anchor.web3.Transaction();
    tx.add(spl.createAssociatedTokenAccountInstruction(provider.wallet.publicKey, ata, owner, mint));
    yield provider.sendAndConfirm(tx, []);
});
exports.createAssociatedTokenAccount = createAssociatedTokenAccount;
const mintTo = (provider, mint, ta, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const tx = new anchor.web3.Transaction();
    tx.add(spl.createMintToInstruction(mint, ta, provider.wallet.publicKey, amount, []));
    yield provider.sendAndConfirm(tx, []);
});
exports.mintTo = mintTo;
const fetchTokenBalance = (userPubKey, mintPubKey, connection) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const associatedTokenAddress = yield spl.getAssociatedTokenAddress(mintPubKey, userPubKey, false);
        const account = yield spl.getAccount(connection, associatedTokenAddress);
        return account === null || account === void 0 ? void 0 : account.amount.toString();
    }
    catch (error) {
        console.error("Error in fetchTokenBalance:", error);
        throw error;
    }
});
exports.fetchTokenBalance = fetchTokenBalance;
