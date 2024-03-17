import {Router} from 'express';
import {getOpenOrders, getTradeHistory, getEventHeap} from '../controllers/orderController'

const router = Router();

router.route('/open-orders').get(getOpenOrders);

router.route('/trade-history').get(getTradeHistory)

router.route('/event-heap').get(getEventHeap)

export default router;