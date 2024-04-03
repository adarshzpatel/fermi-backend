import { WebSocket } from "ws";
import { OWNER_KEYPAIR, WS_PORT } from "./constants";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { initClient, OpenBookV2Client } from "./lib/fermiClient";
import { parseBookSideAccount } from "./lib/parsers";
import logger from "./lib/logger";
import express from "express";


// setup a express server 
const app = express();

// add required middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.listen(3000, () => {
  console.log("Express server listening on port 3000");
});

app.get('/', (req, res) => {
  console.log('FERMI BACKEND')
  res.json({ message: 'FERMI BACKEND' })
})

// Setup Websocket server

const wss = new WebSocket.Server({ port: WS_PORT });

const marketSubscriptions = new Map<string, Set<WebSocket>>();
const subscriptionIds = new Map<string, { bids: number; asks: number }>();
const subscribedMarkets = new Set<string>();

const fermiClient = initClient(OWNER_KEYPAIR);
const solanaConnection = fermiClient.connection;

wss.on("listening", () => {
  logger.info(`Websocket server listening on port ${WS_PORT}`);
});

wss.on("connection", (ws: WebSocket) => {
  // logger.info(" New Client connected ");

  ws.on("message", async (message: string) => {
    try {
      const { type, marketAddress } = JSON.parse(message);

      if (type === "subscribe") {
        // logger.info(`[Websocket] Subscribing to market: ${marketAddress}`);
        await subscribeToMarket(marketAddress, ws);
      } else if (type === "unsubscribe") {
        // logger.info(`[Websocket] Unsubscribing from market: ${marketAddress}`);
        await unsubscribeFromMarket(marketAddress, ws);
      }
    } catch (error) {
      // logger.error(`Error processing message: ${error}`);
    }
  });

  ws.on("close", () => {
    logger.info("Client disconnected");
    unsubscribeFromMarket(null, ws);
  });
  ws.on("error", (error) => {
    logger.error(`Websocket error: ${error}`);
  });
});

// add a listener for wss server disconnect / close
wss.on("close", () => {
  logger.info("Websocket server closed");
});

async function subscribeToMarket(
  marketAddress: string,
  ws: WebSocket
): Promise<void> {
  const marketPublicKey = new PublicKey(marketAddress);
  const market = await fermiClient.deserializeMarketAccount(marketPublicKey);
  if (market) {
    // send initial data
    // Add the client to the market's subscription set
    const subscriptions = marketSubscriptions.get(marketAddress) || new Set();
    subscriptions.add(ws);
    marketSubscriptions.set(marketAddress, subscriptions);

    const bidsAcc = await fermiClient.deserializeBookSide(market.bids);
    const asksAcc = await fermiClient.deserializeBookSide(market.asks);
    const bids = await parseBookSideAccount(bidsAcc, fermiClient);
    const asks = await parseBookSideAccount(asksAcc, fermiClient);
    sendDataToSubscribers(marketAddress, "asks", asks);
    sendDataToSubscribers(marketAddress, "bids", bids);
    
    if (!subscribedMarkets.has(marketAddress)) {
      // logger.info(
      //   `[Websocket] Creating new subscriptions for market: ${marketAddress}`
      // );
      // Market is not subscribed yet, create new subscriptions
      const bidsSubscriptionId = await subscribeToAccount(
        market.bids,
        (accountInfo) =>
          handleBidsChange(marketAddress, accountInfo, fermiClient)
      );
      const asksSubscriptionId = await subscribeToAccount(
        market.asks,
        (accountInfo) =>
          handleAsksChange(marketAddress, accountInfo, fermiClient)
      );

      subscriptionIds.set(marketAddress, {
        bids: bidsSubscriptionId,
        asks: asksSubscriptionId,
      });
      subscribedMarkets.add(marketAddress);
    }
  }
}

async function unsubscribeFromMarket(
  marketAddress: string | null,
  ws: WebSocket
): Promise<void> {
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
        const { bids: bidsSubscriptionId, asks: asksSubscriptionId } =
          subscriptionIds.get(marketAddress)!;
        await unsubscribeFromAccount(bidsSubscriptionId);
        await unsubscribeFromAccount(asksSubscriptionId);
        subscriptionIds.delete(marketAddress);
        subscribedMarkets.delete(marketAddress);
      }
    }
  } else {
    // logger.info("[Websocket] Removing client from all market subscriptions");
    // Remove the client from all market subscriptions
    for (const marketAddress of marketSubscriptions.keys()) {
      await unsubscribeFromMarket(marketAddress, ws);
    }
  }
}

async function subscribeToAccount(
  account: PublicKey,
  callback: (accountInfo: AccountInfo<Buffer>) => void
): Promise<number> {
  return solanaConnection.onAccountChange(account, callback);
}

async function unsubscribeFromAccount(subscriptionId: number): Promise<void> {
  // logger.info(
  //   `[Websocket] Unsubscribing from account with subscription ID: ${subscriptionId}`
  // );
  solanaConnection.removeAccountChangeListener(subscriptionId);
}

function sendDataToSubscribers(
  marketAddress: string,
  dataType: string,
  data: any
): void {
  const subscriptions = marketSubscriptions.get(marketAddress);
  if (subscriptions) {
    const jsonData = JSON.stringify({ type: dataType, data });
    // logger.info(`[Websocket] Sending ${dataType} data to client ${jsonData}`);
    subscriptions.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonData);
      }
    });
  }
}

export async function handleBidsChange(
  marketAddress: string,
  accountInfo: AccountInfo<Buffer>,
  client: OpenBookV2Client
): Promise<void> {
  const data = await client.program.coder.accounts.decode(
    "bookSide",
    accountInfo.data
  );
  const bids = await parseBookSideAccount(data, client);
  // logger.info(`Bids changed for market: ${marketAddress}`);
  sendDataToSubscribers(marketAddress, "bids", bids);
}

export async function handleAsksChange(
  marketAddress: string,
  accountInfo: AccountInfo<Buffer>,
  client: OpenBookV2Client
): Promise<void> {
  const data = await client.program.coder.accounts.decode(
    "bookSide",
    accountInfo.data
  );
  const asks = await parseBookSideAccount(data, client);
  // logger.info(`Asks changed for market: ${marketAddress}`);
  sendDataToSubscribers(marketAddress, "asks", asks);
}
