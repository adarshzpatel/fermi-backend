type Side = "bid" | "ask";

export type OrderItem= {
  id: string;
  market: string;
  price: number;
  quantity: number;
  side: Side;
};


export type Orderbook = OrderItem[]
