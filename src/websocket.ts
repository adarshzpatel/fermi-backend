import { Server, WebSocket } from "ws";
import { Connection, PublicKey, AccountInfo, Keypair } from "@solana/web3.js";
import { OpenBookV2Client } from "./services/fermiClient";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import EmptyWallet from "./utils/solana/emptyWallet";

const config = {
  rpcUrl:
    "https://devnet.helius-rpc.com/?api-key=5163c3d1-8082-442e-8a15-c27bff3cfabb",
  programId: "DVYGTDbAJVTaXyUksSwAwZr3rw5HmKZsATm6EmSenQAq",
  market: "CF3Eh6XKgPfTzcTVeeh1LS2yFa5KND2wyjhxUyoMokn4",
};

const wsPort = 8080;
const server = new Server({ port: wsPort });
const solanaConnection = new Connection(config.rpcUrl, {
  wsEndpoint: config.rpcUrl.replace("https", "wss"),
});
const provider = new AnchorProvider(
  solanaConnection,
  new EmptyWallet(new Keypair()),
  AnchorProvider.defaultOptions()
);
const fermiClient = new OpenBookV2Client(
  provider,
  new PublicKey(config.programId)
);
const marketSubscriptions = new Map<string, Set<WebSocket>>();
const subscriptionIds = new Map<string, { bids: number; asks: number }>();
const subscribedMarkets = new Set<string>();

console.log(`[Websocket] Started websocket server at port: ${wsPort}`);
server.on("connection", (ws: WebSocket) => {
  console.log("[Websocket] Client connected");

  // Handle incoming messages from the client
  ws.on("message", async (message: string) => {
    console.log(`[Websocket] Received message: ${message}`);

    // Parse the received message
    const { type, marketAddress } = JSON.parse(message);

    if (type === "subscribe") {
      console.log(`[Websocket] Subscribing to market: ${marketAddress}`);
      await subscribeToMarket(marketAddress, ws);
    } else if (type === "unsubscribe") {
      console.log(`[Websocket] Unsubscribing from market: ${marketAddress}`);
      await unsubscribeFromMarket(marketAddress, ws);
    }
  });

  // Handle WebSocket connection close
  ws.on("close", () => {
    console.log("[Websocket] Client disconnected");
    // Remove the client from all market subscriptions
    unsubscribeFromMarket(null, ws);
  });
});

async function subscribeToMarket(
  marketAddress: string,
  ws: WebSocket
): Promise<void> {
  const marketPublicKey = new PublicKey(marketAddress);
  const market = await fermiClient.deserializeMarketAccount(marketPublicKey);
  if (market) {
    // Add the client to the market's subscription set
    const subscriptions = marketSubscriptions.get(marketAddress) || new Set();
    subscriptions.add(ws);
    marketSubscriptions.set(marketAddress, subscriptions);

    if (!subscribedMarkets.has(marketAddress)) {
      console.log(
        `[Websocket] Creating new subscriptions for market: ${marketAddress}`
      );
      // Market is not subscribed yet, create new subscriptions
      const bidsSubscriptionId = await subscribeToAccount(
        market.bids,
        (accountInfo) => handleBidsChange(marketAddress, accountInfo)
      );
      const asksSubscriptionId = await subscribeToAccount(
        market.asks,
        (accountInfo) => handleAsksChange(marketAddress, accountInfo)
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
        console.log(
          `[Websocket] No more clients subscribed to market: ${marketAddress}. Unsubscribing from accounts.`
        );
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
    console.log("[Websocket] Removing client from all market subscriptions");
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
  console.log(`[Websocket] Subscribing to account: ${account.toBase58()}`);
  return solanaConnection.onAccountChange(account, callback);
}

async function unsubscribeFromAccount(subscriptionId: number): Promise<void> {
  console.log(
    `[Websocket] Unsubscribing from account with subscription ID: ${subscriptionId}`
  );
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
    subscriptions.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(`[Websocket] Sending ${dataType} data to client`);
        client.send(jsonData);
      }
    });
  }
}

async function handleBidsChange(
  marketAddress: string,
  accountInfo: AccountInfo<Buffer>
): Promise<void> {
  const bids = await parseBookSideAccountInfo(accountInfo);
  console.log(`[Websocket] Bids changed for market: ${marketAddress}`);
  sendDataToSubscribers(marketAddress, "bids", bids);
}

async function handleAsksChange(
  marketAddress: string,
  accountInfo: AccountInfo<Buffer>
): Promise<void> {
  const asks = await parseBookSideAccountInfo(accountInfo);
  console.log(`[Websocket] Asks changed for market: ${marketAddress}`);
  sendDataToSubscribers(marketAddress, "asks", asks);
}

async function parseBookSideAccountInfo(accountInfo: AccountInfo<Buffer>) {
  const data = await fermiClient.program.coder.accounts.decode(
    "bookSide",
    accountInfo.data
  );
  const leafNodes = fermiClient.getLeafNodes(data);

  const parsedLeafNodes = leafNodes.map((node) => ({
    id: node.key.toString(),
    price: new BN(node.key).shrn(64).toString(),
    quantity: node.quantity.toString(),
    owner: node.owner.toString(),
    clientOrderId: node.clientOrderId.toString(),
  }));

  return parsedLeafNodes;
}
