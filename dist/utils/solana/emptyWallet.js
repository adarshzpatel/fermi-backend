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
const wallet_adapter_base_1 = require("@solana/wallet-adapter-base");
class EmptyWallet {
    constructor(payer) {
        this.payer = payer;
    }
    signTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, wallet_adapter_base_1.isVersionedTransaction)(tx)) {
                tx.sign([this.payer]);
            }
            else {
                tx.partialSign(this.payer);
            }
            return tx;
        });
    }
    signAllTransactions(txs) {
        return __awaiter(this, void 0, void 0, function* () {
            return txs.map((t) => {
                if ((0, wallet_adapter_base_1.isVersionedTransaction)(t)) {
                    t.sign([this.payer]);
                }
                else {
                    t.partialSign(this.payer);
                }
                return t;
            });
        });
    }
    get publicKey() {
        return this.payer.publicKey;
    }
}
exports.default = EmptyWallet;
