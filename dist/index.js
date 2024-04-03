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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAsksChange = exports.handleBidsChange = void 0;
const ws_1 = require("ws");
const constants_1 = require("./constants");
const web3_js_1 = require("@solana/web3.js");
const fermiClient_1 = require("./lib/fermiClient");
const parsers_1 = require("./lib/parsers");
const logger_1 = __importDefault(require("./lib/logger"));
const express_1 = __importDefault(require("express"));
// setup a express server 
const app = (0, express_1.default)();
// add required middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.listen(3000, () => {
    console.log("Express server listening on port 3000");
});
app.get('/', (req, res) => {
    console.log('FERMI BACKEND');
    res.json({ message: 'FERMI BACKEND' });
});
// Setup Websocket server
const wss = new ws_1.WebSocket.Server({ port: constants_1.WS_PORT });
const marketSubscriptions = new Map();
const subscriptionIds = new Map();
const subscribedMarkets = new Set();
const fermiClient = (0, fermiClient_1.initClient)(constants_1.OWNER_KEYPAIR);
const solanaConnection = fermiClient.connection;
wss.on("listening", () => {
    logger_1.default.info(`Websocket server listening on port ${constants_1.WS_PORT}`);
});
wss.on("connection", (ws) => {
    // logger.info(" New Client connected ");
    ws.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { type, marketAddress } = JSON.parse(message);
            if (type === "subscribe") {
                // logger.info(`[Websocket] Subscribing to market: ${marketAddress}`);
                yield subscribeToMarket(marketAddress, ws);
            }
            else if (type === "unsubscribe") {
                // logger.info(`[Websocket] Unsubscribing from market: ${marketAddress}`);
                yield unsubscribeFromMarket(marketAddress, ws);
            }
        }
        catch (error) {
            // logger.error(`Error processing message: ${error}`);
        }
    }));
    ws.on("close", () => {
        logger_1.default.info("Client disconnected");
        unsubscribeFromMarket(null, ws);
    });
    ws.on("error", (error) => {
        logger_1.default.error(`Websocket error: ${error}`);
    });
});
// add a listener for wss server disconnect / close
wss.on("close", () => {
    logger_1.default.info("Websocket server closed");
});
function subscribeToMarket(marketAddress, ws) {
    return __awaiter(this, void 0, void 0, function* () {
        const marketPublicKey = new web3_js_1.PublicKey(marketAddress);
        const market = yield fermiClient.deserializeMarketAccount(marketPublicKey);
        if (market) {
            // send initial data
            // Add the client to the market's subscription set
            const subscriptions = marketSubscriptions.get(marketAddress) || new Set();
            subscriptions.add(ws);
            marketSubscriptions.set(marketAddress, subscriptions);
            const bidsAcc = yield fermiClient.deserializeBookSide(market.bids);
            const asksAcc = yield fermiClient.deserializeBookSide(market.asks);
            const bids = yield (0, parsers_1.parseBookSideAccount)(bidsAcc, fermiClient);
            const asks = yield (0, parsers_1.parseBookSideAccount)(asksAcc, fermiClient);
            sendDataToSubscribers(marketAddress, "asks", asks);
            sendDataToSubscribers(marketAddress, "bids", bids);
            if (!subscribedMarkets.has(marketAddress)) {
                // logger.info(
                //   `[Websocket] Creating new subscriptions for market: ${marketAddress}`
                // );
                // Market is not subscribed yet, create new subscriptions
                const bidsSubscriptionId = yield subscribeToAccount(market.bids, (accountInfo) => handleBidsChange(marketAddress, accountInfo, fermiClient));
                const asksSubscriptionId = yield subscribeToAccount(market.asks, (accountInfo) => handleAsksChange(marketAddress, accountInfo, fermiClient));
                subscriptionIds.set(marketAddress, {
                    bids: bidsSubscriptionId,
                    asks: asksSubscriptionId,
                });
                subscribedMarkets.add(marketAddress);
            }
        }
    });
}
function unsubscribeFromMarket(marketAddress, ws) {
    return __awaiter(this, void 0, void 0, function* () {
        if (marketAddress) {
            const subscriptions = marketSubscriptions.get(marketAddress);
            if (subscriptions) {
                subscriptions.delete(ws);
                if (subscriptions.size === 0) {
                    // logger.info(
                    //   `[Websocket] No more clients subscribed to market: ${marketAddress}. Unsubscribing from accounts.`
                    // );
                    // No more clients subscribed to this market, unsubscribe from the accounts
                    marketSubscriptions.delete(marketAddress);
                    const { bids: bidsSubscriptionId, asks: asksSubscriptionId } = subscriptionIds.get(marketAddress);
                    yield unsubscribeFromAccount(bidsSubscriptionId);
                    yield unsubscribeFromAccount(asksSubscriptionId);
                    subscriptionIds.delete(marketAddress);
                    subscribedMarkets.delete(marketAddress);
                }
            }
        }
        else {
            // logger.info("[Websocket] Removing client from all market subscriptions");
            // Remove the client from all market subscriptions
            for (const marketAddress of marketSubscriptions.keys()) {
                yield unsubscribeFromMarket(marketAddress, ws);
            }
        }
    });
}
function subscribeToAccount(account, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        return solanaConnection.onAccountChange(account, callback);
    });
}
function unsubscribeFromAccount(subscriptionId) {
    return __awaiter(this, void 0, void 0, function* () {
        // logger.info(
        //   `[Websocket] Unsubscribing from account with subscription ID: ${subscriptionId}`
        // );
        solanaConnection.removeAccountChangeListener(subscriptionId);
    });
}
function sendDataToSubscribers(marketAddress, dataType, data) {
    const subscriptions = marketSubscriptions.get(marketAddress);
    if (subscriptions) {
        const jsonData = JSON.stringify({ type: dataType, data });
        // logger.info(`[Websocket] Sending ${dataType} data to client ${jsonData}`);
        subscriptions.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(jsonData);
            }
        });
    }
}
function handleBidsChange(marketAddress, accountInfo, client) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield client.program.coder.accounts.decode("bookSide", accountInfo.data);
        const bids = yield (0, parsers_1.parseBookSideAccount)(data, client);
        // logger.info(`Bids changed for market: ${marketAddress}`);
        sendDataToSubscribers(marketAddress, "bids", bids);
    });
}
exports.handleBidsChange = handleBidsChange;
function handleAsksChange(marketAddress, accountInfo, client) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield client.program.coder.accounts.decode("bookSide", accountInfo.data);
        const asks = yield (0, parsers_1.parseBookSideAccount)(data, client);
        // logger.info(`Asks changed for market: ${marketAddress}`);
        sendDataToSubscribers(marketAddress, "asks", asks);
    });
}
exports.handleAsksChange = handleAsksChange;
