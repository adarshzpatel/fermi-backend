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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilteredProgramAccounts = exports.OpenBookV2Client = exports.nameToString = exports.initClient = exports.getProvider = exports.getConnection = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const bytes_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const fermi_pro_1 = require("../idl/fermi-pro");
const rpc_1 = require("../utils/solana/rpc");
const helpers_1 = require("../utils/solana/helpers");
const constants_1 = require("../constants");
const postSendTxCallback = ({ txid }) => {
    console.log(`[Tx Sent] : ${txid}`);
};
/**
 * Creates a connection to the specified RPC URL with the given commitment.
 * If no RPC URL or commitment is provided, default values will be used.
 *
 * @param rpcUrl - The RPC URL to connect to. Defaults to RPC_URL.
 * @param commitment - The commitment level to use. Defaults to COMMITMENT.
 * @returns A new Connection object.
 */
function getConnection(rpcUrl = constants_1.RPC_URL, commitment = constants_1.COMMITMENT) {
    return new web3_js_1.Connection(rpcUrl, commitment);
}
exports.getConnection = getConnection;
/**
 * Returns an instance of the AnchorProvider using the provided connection and wallet.
 * @param connection - The connection object for interacting with the Solana blockchain.
 * @param wallet - The wallet object representing the user's wallet.
 * @returns An instance of the AnchorProvider.
 */
function getProvider(connection, wallet) {
    const provider = new anchor_1.AnchorProvider(connection, wallet, anchor_1.AnchorProvider.defaultOptions());
    return provider;
}
exports.getProvider = getProvider;
/**
 * Initializes a client for interacting with the OpenBookV2 program.
 *
 * @param {Keypair} keypair - The keypair used for signing transactions.
 * @returns {OpenBookV2Client} The initialized OpenBookV2 client.
 */
function initClient(keypair) {
    const wallet = new anchor_1.Wallet(keypair);
    const connection = getConnection();
    const provider = getProvider(connection, wallet);
    const client = new OpenBookV2Client(provider, new web3_js_1.PublicKey(constants_1.PROGRAM_ID), {
        postSendTxCallback,
    });
    return client;
}
exports.initClient = initClient;
function nameToString(name) {
    return bytes_1.utf8.decode(new Uint8Array(name)).split("\x00")[0];
}
exports.nameToString = nameToString;
const BooksideSpace = 90944 + 8;
const EventHeapSpace = 91280 + 8;
class OpenBookV2Client {
    constructor(provider, programId = new web3_js_1.PublicKey(constants_1.PROGRAM_ID), opts = {}) {
        var _a, _b, _c, _d;
        this.provider = provider;
        this.programId = programId;
        this.opts = opts;
        this.program = new anchor_1.Program(fermi_pro_1.IDL, programId, provider);
        this.idsSource = (_a = opts.idsSource) !== null && _a !== void 0 ? _a : "get-program-accounts";
        this.prioritizationFee = (_b = opts === null || opts === void 0 ? void 0 : opts.prioritizationFee) !== null && _b !== void 0 ? _b : 0;
        this.postSendTxCallback = opts === null || opts === void 0 ? void 0 : opts.postSendTxCallback;
        this.txConfirmationCommitment =
            (_d = (_c = opts === null || opts === void 0 ? void 0 : opts.txConfirmationCommitment) !== null && _c !== void 0 ? _c : (this.program.provider.opts !== undefined
                ? this.program.provider.opts.commitment
                : undefined)) !== null && _d !== void 0 ? _d : "processed";
        // TODO: evil side effect, but limited backtraces are a nightmare
        Error.stackTraceLimit = 1000;
    }
    /// Convenience accessors
    get connection() {
        return this.program.provider.connection;
    }
    get walletPk() {
        return this.program.provider.wallet.publicKey;
    }
    setProvider(provider) {
        this.program = new anchor_1.Program(fermi_pro_1.IDL, this.programId, provider);
    }
    /// Transactions
    sendAndConfirmTransaction(ixs_1) {
        return __awaiter(this, arguments, void 0, function* (ixs, opts = {}) {
            var _a;
            return yield (0, rpc_1.sendTransaction)(this.program.provider, ixs, (_a = opts.alts) !== null && _a !== void 0 ? _a : [], Object.assign({ postSendTxCallback: this.postSendTxCallback, prioritizationFee: this.prioritizationFee, txConfirmationCommitment: this.txConfirmationCommitment }, opts));
        });
    }
    createProgramAccount(authority, size) {
        return __awaiter(this, void 0, void 0, function* () {
            const lamports = yield this.connection.getMinimumBalanceForRentExemption(size);
            const address = web3_js_1.Keypair.generate();
            const tx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
                fromPubkey: authority.publicKey,
                newAccountPubkey: address.publicKey,
                lamports,
                space: size,
                programId: this.programId,
            })).instructions;
            yield this.sendAndConfirmTransaction(tx, {
                additionalSigners: [authority, address],
            });
            return address.publicKey;
        });
    }
    createProgramAccountIx(authority, size) {
        return __awaiter(this, void 0, void 0, function* () {
            const lamports = yield this.connection.getMinimumBalanceForRentExemption(size);
            const address = web3_js_1.Keypair.generate();
            const ix = web3_js_1.SystemProgram.createAccount({
                fromPubkey: authority,
                newAccountPubkey: address.publicKey,
                lamports,
                space: size,
                programId: this.programId,
            });
            return [ix, address];
        });
    }
    // Get the MarketAccount from the market publicKey
    deserializeMarketAccount(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.program.account.market.fetch(publicKey);
            }
            catch (error) {
                console.error("Error in deserializeMarketAccount:", error);
                return null;
            }
        });
    }
    deserializeOpenOrderAccount(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.program.account.openOrdersAccount.fetch(publicKey);
            }
            catch (_a) {
                return null;
            }
        });
    }
    deserializeOpenOrdersIndexerAccount(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.program.account.openOrdersIndexer.fetch(publicKey);
            }
            catch (_a) {
                return null;
            }
        });
    }
    deserializeEventHeapAccount(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.program.account.eventHeap.fetch(publicKey);
            }
            catch (_a) {
                return null;
            }
        });
    }
    deserializeBookSide(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.program.account.bookSide.fetch(publicKey);
            }
            catch (_a) {
                return null;
            }
        });
    }
    priceData(key) {
        const shiftedValue = key.shrn(64); // Shift right by 64 bits
        return shiftedValue.toNumber(); // Convert BN to a regular number
    }
    // Get bids or asks from a bookside account
    getLeafNodes(bookside) {
        const leafNodesData = bookside.nodes.nodes.filter((x) => x.tag === 2);
        const leafNodes = [];
        for (const x of leafNodesData) {
            const leafNode = this.program.coder.types.decode("LeafNode", Buffer.from([0, ...x.data]));
            leafNodes.push(leafNode);
        }
        return leafNodes;
    }
    createMarketIx(payer_1, name_1, quoteMint_1, baseMint_1, quoteLotSize_1, baseLotSize_1, makerFee_1, takerFee_1, timeExpiry_1, oracleA_1, oracleB_1, openOrdersAdmin_1, consumeEventsAdmin_1, closeMarketAdmin_1) {
        return __awaiter(this, arguments, void 0, function* (payer, name, quoteMint, baseMint, quoteLotSize, baseLotSize, makerFee, takerFee, timeExpiry, oracleA, oracleB, openOrdersAdmin, consumeEventsAdmin, closeMarketAdmin, oracleConfigParams = {
            confFilter: 0.1,
            maxStalenessSlots: 100,
        }, market = web3_js_1.Keypair.generate(), collectFeeAdmin) {
            const [bidIx, bidsKeypair] = yield this.createProgramAccountIx(payer, BooksideSpace);
            const [askIx, askKeypair] = yield this.createProgramAccountIx(payer, BooksideSpace);
            const [eventHeapIx, eventHeapKeypair] = yield this.createProgramAccountIx(payer, EventHeapSpace);
            const [marketAuthority] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("Market"), market.publicKey.toBuffer()], this.program.programId);
            const baseVault = (0, spl_token_1.getAssociatedTokenAddressSync)(baseMint, marketAuthority, true);
            const quoteVault = (0, spl_token_1.getAssociatedTokenAddressSync)(quoteMint, marketAuthority, true);
            const [eventAuthority] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], this.program.programId);
            const ix = yield this.program.methods
                .createMarket(name, oracleConfigParams, quoteLotSize, baseLotSize, makerFee, takerFee, timeExpiry)
                .accounts({
                market: market.publicKey,
                marketAuthority,
                bids: bidsKeypair.publicKey,
                asks: askKeypair.publicKey,
                eventHeap: eventHeapKeypair.publicKey,
                payer,
                marketBaseVault: baseVault,
                marketQuoteVault: quoteVault,
                baseMint,
                quoteMint,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
                oracleA,
                oracleB,
                collectFeeAdmin: collectFeeAdmin != null ? collectFeeAdmin : payer,
                openOrdersAdmin,
                consumeEventsAdmin,
                closeMarketAdmin,
                eventAuthority,
                program: this.programId,
            })
                .instruction();
            return [
                [bidIx, askIx, eventHeapIx, ix],
                [market, bidsKeypair, askKeypair, eventHeapKeypair],
            ];
        });
    }
    // Book and EventHeap must be empty before closing a market.
    // Make sure to call consumeEvents and pruneOrders before closing the market.
    closeMarketIx(marketPublicKey_1, market_1, solDestination_1) {
        return __awaiter(this, arguments, void 0, function* (marketPublicKey, market, solDestination, closeMarketAdmin = null) {
            const ix = yield this.program.methods
                .closeMarket()
                .accounts({
                closeMarketAdmin: market.closeMarketAdmin.key,
                market: marketPublicKey,
                asks: market.asks,
                bids: market.bids,
                eventHeap: market.eventHeap,
                solDestination: solDestination,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .instruction();
            const signers = [];
            if (this.walletPk !== market.closeMarketAdmin.key &&
                closeMarketAdmin !== null) {
                signers.push(closeMarketAdmin);
            }
            return [ix, signers];
        });
    }
    // Each owner has one open order indexer
    findOpenOrdersIndexer(owner = this.walletPk) {
        const [openOrdersIndexer] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("OpenOrdersIndexer"), owner.toBuffer()], this.programId);
        return openOrdersIndexer;
    }
    createOpenOrdersIndexer(openOrdersIndexer) {
        return __awaiter(this, void 0, void 0, function* () {
            const ix = yield this.program.methods
                .createOpenOrdersIndexer()
                .accounts({
                openOrdersIndexer,
                owner: this.walletPk,
                payer: this.walletPk,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .instruction();
            return yield this.sendAndConfirmTransaction([ix]);
        });
    }
    createOpenOrdersIndexerIx(openOrdersIndexer_1) {
        return __awaiter(this, arguments, void 0, function* (openOrdersIndexer, owner = this.walletPk) {
            return yield this.program.methods
                .createOpenOrdersIndexer()
                .accounts({
                openOrdersIndexer,
                owner,
                payer: this.walletPk,
            })
                .instruction();
        });
    }
    findAllOpenOrders() {
        return __awaiter(this, arguments, void 0, function* (owner = this.walletPk) {
            var _a;
            const indexer = this.findOpenOrdersIndexer(owner);
            const indexerAccount = yield this.deserializeOpenOrdersIndexerAccount(indexer);
            return (_a = indexerAccount === null || indexerAccount === void 0 ? void 0 : indexerAccount.addresses) !== null && _a !== void 0 ? _a : [];
        });
    }
    findOpenOrderAtIndex(owner = this.walletPk, accountIndex) {
        const [openOrders] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("OpenOrders"),
            owner.toBuffer(),
            accountIndex.toArrayLike(Buffer, "le", 4),
        ], this.programId);
        return openOrders;
    }
    findOpenOrdersForMarket() {
        return __awaiter(this, arguments, void 0, function* (owner = this.walletPk, market) {
            var _a, e_1, _b, _c;
            const openOrdersForMarket = [];
            const allOpenOrders = yield this.findAllOpenOrders(owner);
            try {
                for (var _d = true, allOpenOrders_1 = __asyncValues(allOpenOrders), allOpenOrders_1_1; allOpenOrders_1_1 = yield allOpenOrders_1.next(), _a = allOpenOrders_1_1.done, !_a; _d = true) {
                    _c = allOpenOrders_1_1.value;
                    _d = false;
                    const openOrders = _c;
                    const openOrdersAccount = yield this.deserializeOpenOrderAccount(openOrders);
                    if ((openOrdersAccount === null || openOrdersAccount === void 0 ? void 0 : openOrdersAccount.market.toString()) === market.toString()) {
                        openOrdersForMarket.push(openOrders);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = allOpenOrders_1.return)) yield _b.call(allOpenOrders_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return openOrdersForMarket;
        });
    }
    createOpenOrdersIx(market_1, name_1) {
        return __awaiter(this, arguments, void 0, function* (market, name, owner = this.walletPk, delegateAccount) {
            const ixs = [];
            let accountIndex = new anchor_1.BN(1);
            const openOrdersIndexer = this.findOpenOrdersIndexer(owner);
            try {
                const storedIndexer = yield this.deserializeOpenOrdersIndexerAccount(openOrdersIndexer);
                if (storedIndexer == null) {
                    ixs.push(yield this.createOpenOrdersIndexerIx(openOrdersIndexer, owner));
                }
                else {
                    accountIndex = new anchor_1.BN(storedIndexer.createdCounter + 1);
                }
            }
            catch (_a) {
                ixs.push(yield this.createOpenOrdersIndexerIx(openOrdersIndexer, owner));
            }
            const openOrdersAccount = this.findOpenOrderAtIndex(owner, accountIndex);
            ixs.push(yield this.program.methods
                .createOpenOrdersAccount(name)
                .accounts({
                openOrdersIndexer,
                openOrdersAccount,
                market,
                owner,
                delegateAccount,
                payer: this.walletPk,
                // systemProgram: SystemProgram.programId,
            })
                .instruction());
            return [ixs, openOrdersAccount];
        });
    }
    createOpenOrders(payer_1, market_1, name_1) {
        return __awaiter(this, arguments, void 0, function* (payer, market, name, owner = payer, delegateAccount = null) {
            const [ixs, openOrdersAccount] = yield this.createOpenOrdersIx(market, name, owner.publicKey, delegateAccount);
            const additionalSigners = [payer];
            if (owner !== payer) {
                additionalSigners.push(owner);
            }
            yield this.sendAndConfirmTransaction(ixs, {
                additionalSigners,
            });
            return openOrdersAccount;
        });
    }
    depositIx(openOrdersPublicKey, openOrdersAccount, market, userBaseAccount, userQuoteAccount, baseAmount, quoteAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const ix = yield this.program.methods
                .deposit(baseAmount, quoteAmount)
                .accounts({
                owner: openOrdersAccount.owner,
                market: openOrdersAccount.market,
                openOrdersAccount: openOrdersPublicKey,
                userBaseAccount,
                userQuoteAccount,
                marketBaseVault: market.marketBaseVault,
                marketQuoteVault: market.marketQuoteVault,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .instruction();
            return ix;
        });
    }
    depositNativeIx(openOrdersPublicKey, openOrdersAccount, market, userBaseAccount, userQuoteAccount, baseAmount, quoteAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const wrappedSolAccount = new web3_js_1.Keypair();
            let preInstructions = [];
            let postInstructions = [];
            const additionalSigners = [];
            const lamports = baseAmount.add(new anchor_1.BN(1e7));
            preInstructions = [
                web3_js_1.SystemProgram.createAccount({
                    fromPubkey: openOrdersAccount.owner,
                    newAccountPubkey: wrappedSolAccount.publicKey,
                    lamports: lamports.toNumber(),
                    space: 165,
                    programId: spl_token_1.TOKEN_PROGRAM_ID,
                }),
                (0, spl_token_1.createInitializeAccount3Instruction)(wrappedSolAccount.publicKey, spl_token_1.NATIVE_MINT, openOrdersAccount.owner),
            ];
            postInstructions = [
                (0, spl_token_1.createCloseAccountInstruction)(wrappedSolAccount.publicKey, openOrdersAccount.owner, openOrdersAccount.owner),
            ];
            additionalSigners.push(wrappedSolAccount);
            const ix = yield this.program.methods
                .deposit(baseAmount, quoteAmount)
                .accounts({
                owner: openOrdersAccount.owner,
                market: openOrdersAccount.market,
                openOrdersAccount: openOrdersPublicKey,
                userBaseAccount,
                userQuoteAccount,
                marketBaseVault: market.marketBaseVault,
                marketQuoteVault: market.marketBaseVault,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .instruction();
            return [[...preInstructions, ix, ...postInstructions], additionalSigners];
        });
    }
    decodeMarket(data) {
        return this.program.coder.accounts.decode("Market", data);
    }
    placeOrderIx(openOrdersPublicKey, marketPublicKey, market, marketAuthority, userTokenAccount, openOrdersAdmin, args, remainingAccounts, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            const marketVault = args.side === helpers_1.Side.Bid ? market.marketQuoteVault : market.marketBaseVault;
            const accountsMeta = remainingAccounts.map((remaining) => ({
                pubkey: remaining,
                isSigner: false,
                isWritable: true,
            }));
            const MVmint = yield (0, helpers_1.checkMintOfATA)(this.connection, marketVault);
            const ix = yield this.program.methods
                .placeOrder(args)
                .accounts({
                signer: openOrdersDelegate != null
                    ? openOrdersDelegate.publicKey
                    : this.walletPk,
                asks: market.asks,
                bids: market.bids,
                marketVault,
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                marketAuthority: marketAuthority,
                openOrdersAccount: openOrdersPublicKey,
                oracleA: market.oracleA.key,
                oracleB: market.oracleB.key,
                userTokenAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                openOrdersAdmin,
            })
                .remainingAccounts(accountsMeta)
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    placeOrderPeggedIx(openOrdersPublicKey, marketPublicKey, market, userTokenAccount, openOrdersAdmin, args, remainingAccounts, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            const marketVault = args.side === helpers_1.Side.Bid ? market.marketQuoteVault : market.marketBaseVault;
            const accountsMeta = remainingAccounts.map((remaining) => ({
                pubkey: remaining,
                isSigner: false,
                isWritable: true,
            }));
            const ix = yield this.program.methods
                .placeOrderPegged(args)
                .accounts({
                signer: openOrdersDelegate != null
                    ? openOrdersDelegate.publicKey
                    : this.walletPk,
                asks: market.asks,
                bids: market.bids,
                marketVault,
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                openOrdersAccount: openOrdersPublicKey,
                oracleA: market.oracleA.key,
                oracleB: market.oracleB.key,
                userTokenAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                openOrdersAdmin,
            })
                .remainingAccounts(accountsMeta)
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    placeTakeOrderIx(marketPublicKey, market, userBaseAccount, userQuoteAccount, openOrdersAdmin, args, referrerAccount, remainingAccounts, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountsMeta = remainingAccounts.map((remaining) => ({
                pubkey: remaining,
                isSigner: false,
                isWritable: true,
            }));
            const ix = yield this.program.methods
                .placeTakeOrder(args)
                .accounts({
                signer: openOrdersDelegate != null
                    ? openOrdersDelegate.publicKey
                    : this.walletPk,
                asks: market.asks,
                bids: market.bids,
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                oracleA: market.oracleA.key,
                oracleB: market.oracleB.key,
                userBaseAccount,
                userQuoteAccount,
                marketBaseVault: market.marketBaseVault,
                marketQuoteVault: market.marketQuoteVault,
                marketAuthority: market.marketAuthority,
                referrerAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                openOrdersAdmin,
            })
                .remainingAccounts(accountsMeta)
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    cancelAndPlaceOrdersIx(openOrdersPublicKey, marketPublicKey, market, userBaseAccount, userQuoteAccount, openOrdersAdmin, cancelClientOrdersIds, placeOrders, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            const ix = yield this.program.methods
                .cancelAndPlaceOrders(cancelClientOrdersIds, placeOrders)
                .accounts({
                signer: openOrdersDelegate != null
                    ? openOrdersDelegate.publicKey
                    : this.walletPk,
                asks: market.asks,
                bids: market.bids,
                marketQuoteVault: market.marketQuoteVault,
                marketBaseVault: market.marketBaseVault,
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                openOrdersAccount: openOrdersPublicKey,
                oracleA: market.oracleA.key,
                oracleB: market.oracleB.key,
                userBaseAccount,
                userQuoteAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                openOrdersAdmin,
            })
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    cancelOrderById(openOrdersPublicKey, openOrdersAccount, market, orderId, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            const ix = yield this.program.methods
                .cancelOrder(orderId)
                .accounts({
                signer: openOrdersAccount.owner,
                asks: market.asks,
                bids: market.bids,
                market: openOrdersAccount.market,
                openOrdersAccount: openOrdersPublicKey,
            })
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    cancelOrderByClientId(openOrdersPublicKey, openOrdersAccount, market, clientOrderId, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            const ix = yield this.program.methods
                .cancelOrderByClientOrderId(clientOrderId)
                .accounts({
                signer: openOrdersAccount.owner,
                asks: market.asks,
                bids: market.bids,
                market: openOrdersAccount.market,
                openOrdersAccount: openOrdersPublicKey,
            })
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    closeOpenOrdersIndexerIx(owner, market, openOrdersIndexer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (openOrdersIndexer == null) {
                openOrdersIndexer = this.findOpenOrdersIndexer(owner.publicKey);
            }
            if (openOrdersIndexer !== null) {
                const ix = yield this.program.methods
                    .closeOpenOrdersIndexer()
                    .accounts({
                    owner: owner.publicKey,
                    openOrdersIndexer: market.asks,
                    solDestination: market.bids,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                })
                    .instruction();
                const additionalSigners = [];
                if (owner.publicKey !== this.walletPk) {
                    additionalSigners.push(owner);
                }
                return [ix, additionalSigners];
            }
            throw new Error("No open order indexer for the specified owner");
        });
    }
    settleFundsIx(openOrdersPublicKey, openOrdersAccount, marketPublicKey, market, openOrdersDelegate) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userPk = openOrdersAccount.owner;
            const userBaseAccount = new web3_js_1.PublicKey(yield (0, helpers_1.checkOrCreateAssociatedTokenAccount)(this.provider, market.baseMint, userPk));
            const userQuoteAccount = new web3_js_1.PublicKey(yield (0, helpers_1.checkOrCreateAssociatedTokenAccount)(this.provider, market.quoteMint, userPk));
            const ix = yield this.program.methods
                .settleFunds()
                .accounts({
                owner: (_a = openOrdersDelegate === null || openOrdersDelegate === void 0 ? void 0 : openOrdersDelegate.publicKey) !== null && _a !== void 0 ? _a : openOrdersAccount.owner,
                penaltyPayer: openOrdersAccount.owner,
                openOrdersAccount: openOrdersPublicKey,
                market: marketPublicKey,
                marketAuthority: market.marketAuthority,
                marketBaseVault: market.marketBaseVault,
                marketQuoteVault: market.marketQuoteVault,
                userBaseAccount,
                userQuoteAccount,
                referrerAccount: market.marketQuoteVault,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .instruction();
            const signers = [];
            if (openOrdersDelegate != null) {
                signers.push(openOrdersDelegate);
            }
            return [ix, signers];
        });
    }
    closeOpenOrdersAccountIx(payer_1) {
        return __awaiter(this, arguments, void 0, function* (payer, owner = payer, openOrdersPublicKey, market, solDestination = this.walletPk, openOrdersIndexer) {
            if (openOrdersIndexer == null) {
                openOrdersIndexer = this.findOpenOrdersIndexer(owner.publicKey);
            }
            if (openOrdersIndexer !== null) {
                const ix = yield this.program.methods
                    .closeOpenOrdersAccount()
                    .accounts({
                    payer: payer.publicKey,
                    owner: owner.publicKey,
                    openOrdersIndexer,
                    openOrdersAccount: openOrdersPublicKey,
                    solDestination,
                    systemProgram: web3_js_1.SystemProgram.programId,
                })
                    .instruction();
                const additionalSigners = [payer];
                if (owner !== payer) {
                    additionalSigners.push(owner);
                }
                return [ix, additionalSigners];
            }
            throw new Error("No open order indexer for the specified owner");
        });
    }
    // Use getAccountsToConsume as a helper
    consumeEventsIx(marketPublicKey, market, limit, remainingAccounts) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountsMeta = remainingAccounts.map((remaining) => ({
                pubkey: remaining,
                isSigner: false,
                isWritable: true,
            }));
            const eventAdminBs58 = market.consumeEventsAdmin.key.toBase58();
            const consumeEventsAdmin = eventAdminBs58 === web3_js_1.PublicKey.default.toBase58()
                ? null
                : market.consumeEventsAdmin.key;
            const ix = yield this.program.methods
                .consumeEvents(limit)
                .accounts({
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                consumeEventsAdmin,
            })
                .remainingAccounts(accountsMeta)
                .instruction();
            return ix;
        });
    }
    // Consume events for one specific account. Add other extra accounts as it's "free".
    consumeEventsForAccountIx(marketPublicKey, market, openOrdersAccount
    // ): Promise<TransactionInstruction> {
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const slots = yield this.getSlotsToConsume(openOrdersAccount, market);
            const allAccounts = yield this.getAccountsToConsume(market);
            // Create a set to remove duplicates
            const uniqueAccounts = new Set([openOrdersAccount, ...allAccounts]);
            // Limit extra accounts to 10 due tx limit and add openOrdersAccount
            const remainingAccounts = [...uniqueAccounts].slice(0, 10);
            const accountsMeta = remainingAccounts.map((remaining) => ({
                pubkey: remaining,
                isSigner: false,
                isWritable: true,
            }));
            /*
            const ix = await this.program.methods
              .consumeGivenEvents(slots)
              .accounts({
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                consumeEventsAdmin: market.consumeEventsAdmin.key,
              })
              .remainingAccounts(accountsMeta)
              .instruction();
            return ix; */
        });
    }
    createFinalizeGivenEventsInstruction(marketPublicKey, marketAuthority, eventHeapPublicKey, makerAtaPublicKey, takerAtaPublicKey, marketVaultBasePublicKey, marketVaultQuotePublicKey, maker, taker, slotsToConsume) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = {
                market: marketPublicKey,
                marketAuthority: marketAuthority,
                eventHeap: eventHeapPublicKey,
                makerAta: makerAtaPublicKey,
                takerAta: takerAtaPublicKey,
                marketVaultBase: marketVaultBasePublicKey,
                marketVaultQuote: marketVaultQuotePublicKey,
                maker: maker,
                taker: taker,
                // marketAuthorityPDA: marketAuthorityPDA,
                // tokenProgram: tokenProgramPublicKey,
                // Add other accounts as required by the instruction
            };
            const argsForAtomicFinalizeGivenEvents = [
                { name: "slots", type: { vec: slotsToConsume } },
                // Add other arguments as required by the method's signature
            ];
            const modifyComputeUnits = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                units: 300000,
            });
            const ix = yield this.program.methods
                .atomicFinalizeGivenEvents(slotsToConsume)
                .accounts(accounts)
                .preInstructions([modifyComputeUnits])
                .instruction();
            const signers = [];
            // Add any additional signers if necessary
            return [[modifyComputeUnits, ix], signers];
        });
    }
    createCancelGivenEventIx(side, marketPublicKey, marketAuthority, eventHeapPublicKey, makerAtaPublicKey, takerAtaPublicKey, marketVaultBasePublicKey, marketVaultQuotePublicKey, maker, taker, slotsToConsume) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = {
                market: marketPublicKey,
                marketAuthority: marketAuthority,
                eventHeap: eventHeapPublicKey,
                makerAta: makerAtaPublicKey,
                takerAta: takerAtaPublicKey,
                marketVaultBase: marketVaultBasePublicKey,
                marketVaultQuote: marketVaultQuotePublicKey,
                maker: maker,
                taker: taker,
                // marketAuthorityPDA: marketAuthorityPDA,
                // tokenProgram: tokenProgramPublicKey,
                // Add other accounts as required by the instruction
            };
            const ix = yield this.program.methods
                .cancelWithPenalty(side, slotsToConsume)
                .accounts({
                maker: maker,
                taker: taker,
                eventHeap: eventHeapPublicKey,
                makerAta: makerAtaPublicKey,
                takerAta: takerAtaPublicKey,
                market: marketPublicKey,
            })
                .instruction();
            const signers = [];
            // Add any additional signers if necessary
            return [ix, signers];
        });
    }
    createFinalizeEventsInstruction(marketPublicKey, 
    // market: MarketAccount,
    marketAuthority, eventHeapPublicKey, makerAtaPublicKey, takerAtaPublicKey, marketVaultBasePublicKey, marketVaultQuotePublicKey, maker, taker, 
    // tokenProgramPublicKey: PublicKey,
    // marketAuthorityPDA,
    slotsToConsume) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = {
                market: marketPublicKey,
                marketAuthority: marketAuthority,
                eventHeap: eventHeapPublicKey,
                makerAta: makerAtaPublicKey,
                takerAta: takerAtaPublicKey,
                marketVaultBase: marketVaultBasePublicKey,
                marketVaultQuote: marketVaultQuotePublicKey,
                maker: maker,
                taker: taker,
                //marketAuthorityPDA: marketAuthorityPDA,
                // tokenProgram: tokenProgramPublicKey,
                // Add other accounts as required by the instruction
            };
            const additionalComputeBudgetInstruction = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                units: 400000,
            });
            const ix = yield this.program.methods
                .atomicFinalizeEvents(slotsToConsume)
                .accounts(accounts)
                .preInstructions([additionalComputeBudgetInstruction])
                .instruction();
            const signers = [];
            // Add any additional signers if necessary
            return [ix, signers];
        });
    }
    // In order to get slots for certain key use getSlotsToConsume and include the key in the remainingAccounts
    consumeGivenEventsIx(marketPublicKey, market, slots, remainingAccounts
    // ): Promise<TransactionInstruction> {
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountsMeta = remainingAccounts.map((remaining) => ({
                pubkey: remaining,
                isSigner: false,
                isWritable: true,
            }));
            /*const ix = await this.program.methods
              .consumeGivenEvents(slots)
              .accounts({
                eventHeap: market.eventHeap,
                market: marketPublicKey,
                consumeEventsAdmin: market.consumeEventsAdmin.key,
              })
              .remainingAccounts(accountsMeta)
              .instruction();
            return ix; */
        });
    }
    pruneOrdersIx(marketPublicKey_1, market_1, openOrdersPublicKey_1, limit_1) {
        return __awaiter(this, arguments, void 0, function* (marketPublicKey, market, openOrdersPublicKey, limit, closeMarketAdmin = null) {
            const ix = yield this.program.methods
                .pruneOrders(limit)
                .accounts({
                closeMarketAdmin: market.closeMarketAdmin.key,
                openOrdersAccount: openOrdersPublicKey,
                market: marketPublicKey,
                bids: market.bids,
                asks: market.asks,
            })
                .instruction();
            const signers = [];
            if (this.walletPk !== market.closeMarketAdmin.key &&
                closeMarketAdmin !== null) {
                signers.push(closeMarketAdmin);
            }
            return [ix, signers];
        });
    }
    getAccountsToConsume(market) {
        return __awaiter(this, void 0, void 0, function* () {
            let accounts = new Array();
            const eventHeap = yield this.deserializeEventHeapAccount(market.eventHeap);
            if (eventHeap != null) {
                for (const node of eventHeap.nodes) {
                    if (node.event.eventType === 0) {
                        const fillEvent = this.program.coder.types.decode("FillEvent", Buffer.from([0, ...node.event.padding]));
                        console.log("FillEvent Details:", fillEvent);
                        accounts = accounts
                            .filter((a) => a !== fillEvent.maker)
                            .concat([fillEvent.maker]);
                    }
                    else {
                        const outEvent = this.program.coder.types.decode("OutEvent", Buffer.from([0, ...node.event.padding]));
                        accounts = accounts
                            .filter((a) => a !== outEvent.owner)
                            .concat([outEvent.owner]);
                    }
                    // Tx would be too big, do not add more accounts
                    if (accounts.length > 20)
                        return accounts;
                }
            }
            return accounts;
        });
    }
    getSlotsToConsume(key, market) {
        return __awaiter(this, void 0, void 0, function* () {
            const slots = new Array();
            const eventHeap = yield this.deserializeEventHeapAccount(market.eventHeap);
            if (eventHeap != null) {
                for (const [i, node] of eventHeap.nodes.entries()) {
                    if (node.event.eventType === 0) {
                        const fillEvent = this.program.coder.types.decode("FillEvent", Buffer.from([0, ...node.event.padding]));
                        if (key === fillEvent.maker)
                            slots.push(new anchor_1.BN(i));
                    }
                    else {
                        const outEvent = this.program.coder.types.decode("OutEvent", Buffer.from([0, ...node.event.padding]));
                        if (key === outEvent.owner)
                            slots.push(new anchor_1.BN(i));
                    }
                }
            }
            return slots;
        });
    }
}
exports.OpenBookV2Client = OpenBookV2Client;
function getFilteredProgramAccounts(connection, programId, filters) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-expect-error not need check
        const resp = yield connection._rpcRequest("getProgramAccounts", [
            programId.toBase58(),
            {
                commitment: connection.commitment,
                filters,
                encoding: "base64",
            },
        ]);
        if (resp.error !== null) {
            throw new Error(resp.error.message);
        }
        return resp.result.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
            publicKey: new web3_js_1.PublicKey(pubkey),
            accountInfo: {
                data: Buffer.from(data[0], "base64"),
                executable,
                owner: new web3_js_1.PublicKey(owner),
                lamports,
            },
        }));
    });
}
exports.getFilteredProgramAccounts = getFilteredProgramAccounts;
