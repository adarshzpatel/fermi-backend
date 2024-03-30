import { BN } from "@coral-xyz/anchor";
import { OpenBookV2Client } from "./fermiClient";

export async function parseBookSideAccount(acc: any, client: OpenBookV2Client) {
  const leafNodes = client.getLeafNodes(acc);
  const parsedLeafNodes = leafNodes.map((node) => ({
    id: node.key.toString(),
    price: new BN(node.key).shrn(64).toString(),
    quantity: node.quantity.toString(),
    owner: node.owner.toString(),
    clientOrderId: node.clientOrderId.toString(),
  }));

  return parsedLeafNodes;
}

