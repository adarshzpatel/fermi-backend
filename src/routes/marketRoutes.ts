import {Router} from 'express';
import {airdrop,  createMarket, getMarketAddress} from '../controllers/marketController'

const router = Router();

//routes
router.route("/air-drop").post(airdrop)

router.route("/create-market").post(createMarket)

router.route("/get-market/:address").get(getMarketAddress);

export default router;




