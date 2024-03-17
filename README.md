
#TODO 
[] Create Routes 
[] Connect controllers 


# ROUTES

POST /airdrop {receiverAddres,tokenMintAddress,amount}
POST /create-market {name}

GET /market?address
GET /open-orders?owner=address // supabase - select * from open_orders where owner == 'address' AND status = 'pending'
GET /trade-history?address // supbase - select 
GET /event-heap?address

WEBSOCKET /orderbook 


# TABLES
ORDERBOOK
- id 
- timestamp
- price 
- quantity
- side : Bid | Ask ( bid = buy , ask = sell)
- owner 

USERS
- walletPk 
- 

OPEN_ORDERS 
- id
- oo_account : 
- timestamp 
- quantity
- price 
- side 
- owner 
- status: FINALISE | CANCELLED | CANCELLED_PENALTY | PENDING  


OO User table 
Status: FINALISED | CANCELLED | CANCELLED_PENALTY | PENDING
UserPubKey => 
	Position : { native free base, native free quote}
	OrderID : { side, qty, price, clientOrderID ,status}

Orderbook 
     - Bids: {price, qty, orderId, time}
     - Asks: {price, qty, orderId, time}

EventHeap
	Default KV pairs.

Price: 
Track FillEvents Price + timestamp from eventHeap
Historical: [{ traded_price, timestamp}, {...}]
