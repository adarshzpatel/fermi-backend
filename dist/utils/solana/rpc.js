"use strict";
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
exports.createComputeBudgetIx = exports.sendTransaction = void 0;
const web3_js_1 = require("@solana/web3.js");
function sendTransaction(provider_1, ixs_1, alts_1) {
    return __awaiter(this, arguments, void 0, function* (provider, ixs, alts, opts = {}) {
        var _a, _b, _c, _d;
        const connection = provider.connection;
        if (connection.banksClient !== undefined) {
            const tx = new web3_js_1.Transaction();
            for (const ix of ixs) {
                tx.add(ix);
            }
            tx.feePayer = provider.wallet.publicKey;
            [tx.recentBlockhash] = yield connection.banksClient.getLatestBlockhash();
            for (const signer of opts === null || opts === void 0 ? void 0 : opts.additionalSigners) {
                tx.partialSign(signer);
            }
            yield connection.banksClient.processTransaction(tx);
            return "";
        }
        const latestBlockhash = (_a = opts === null || opts === void 0 ? void 0 : opts.latestBlockhash) !== null && _a !== void 0 ? _a : (yield connection.getLatestBlockhash((_c = (_b = opts === null || opts === void 0 ? void 0 : opts.preflightCommitment) !== null && _b !== void 0 ? _b : provider.opts.preflightCommitment) !== null && _c !== void 0 ? _c : "finalized"));
        const payer = provider.wallet;
        if ((opts === null || opts === void 0 ? void 0 : opts.prioritizationFee) !== null && opts.prioritizationFee !== 0) {
            ixs = [(0, exports.createComputeBudgetIx)(opts.prioritizationFee), ...ixs];
        }
        const message = web3_js_1.MessageV0.compile({
            payerKey: provider.wallet.publicKey,
            instructions: ixs,
            recentBlockhash: latestBlockhash.blockhash,
            addressLookupTableAccounts: alts,
        });
        let vtx = new web3_js_1.VersionedTransaction(message);
        if ((opts === null || opts === void 0 ? void 0 : opts.additionalSigners) !== undefined &&
            (opts === null || opts === void 0 ? void 0 : opts.additionalSigners.length) !== 0) {
            vtx.sign([...opts === null || opts === void 0 ? void 0 : opts.additionalSigners]);
        }
        vtx = (yield payer.signTransaction(vtx));
        const signature = yield connection.sendRawTransaction(vtx.serialize(), {
            skipPreflight: true, // mergedOpts.skipPreflight,
        });
        if ((opts === null || opts === void 0 ? void 0 : opts.postSendTxCallback) !== undefined &&
            (opts === null || opts === void 0 ? void 0 : opts.postSendTxCallback) !== null) {
            try {
                opts.postSendTxCallback({ txid: signature });
            }
            catch (e) {
                console.warn(`postSendTxCallback error`, e);
            }
        }
        const txConfirmationCommitment = (_d = opts === null || opts === void 0 ? void 0 : opts.txConfirmationCommitment) !== null && _d !== void 0 ? _d : "processed";
        let status;
        if (latestBlockhash.blockhash != null &&
            latestBlockhash.lastValidBlockHeight != null) {
            status = (yield connection.confirmTransaction({
                signature: signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, txConfirmationCommitment)).value;
        }
        else {
            status = (yield connection.confirmTransaction(signature, txConfirmationCommitment)).value;
        }
        if (status.err !== "" && status.err !== null) {
            console.warn("Tx status: ", status);
            throw new OpenBookError({
                txid: signature,
                message: `${JSON.stringify(status)}`,
            });
        }
        return signature;
    });
}
exports.sendTransaction = sendTransaction;
const createComputeBudgetIx = (microLamports) => {
    const computeBudgetIx = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
        microLamports,
    });
    return computeBudgetIx;
};
exports.createComputeBudgetIx = createComputeBudgetIx;
class OpenBookError extends Error {
    constructor({ txid, message }) {
        super();
        this.message = message;
        this.txid = txid;
    }
}
