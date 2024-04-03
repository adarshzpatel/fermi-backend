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
exports.parseBookSideAccount = void 0;
const anchor_1 = require("@coral-xyz/anchor");
function parseBookSideAccount(acc, client) {
    return __awaiter(this, void 0, void 0, function* () {
        const leafNodes = client.getLeafNodes(acc);
        const parsedLeafNodes = leafNodes.map((node) => ({
            id: node.key.toString(),
            price: new anchor_1.BN(node.key).shrn(64).toString(),
            quantity: node.quantity.toString(),
            owner: node.owner.toString(),
            clientOrderId: node.clientOrderId.toString(),
        }));
        return parsedLeafNodes;
    });
}
exports.parseBookSideAccount = parseBookSideAccount;
