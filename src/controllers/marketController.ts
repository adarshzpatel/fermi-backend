import { Request, Response } from 'express';

//airdrop
const airdrop = async (req:Request, res:Response) => {
    try {
        const { receiverAddress, tokenMintAddress, amount } = req.body;
      
        // Logic for airdrop
        res
        .status(200)
        .json(
            { success: true, 
            message: 'Airdrop successful' 
        });
    } catch (error) {
        console.error('Error during airdrop:');
        res
        .status(500)
        .json(
            { success: false, 
           message: 'Internal server error' });
    }
};

//crate market
const createMarket = async (req:Request, res:Response) => {
    try {
        const { name } = req.body;
      //logic
        res
        .status(200)
        .json(
            { success: true, 
            message: 'Market created successfully' 
        });
    } catch (error) {
        console.error('Error creating market:');
        res
        .status(500)
        .json(
            { success: false,
             message: 'Internal server error' });
    }
};



//market address
const getMarketAddress = async (req: Request, res: Response)=> {
    try {
        const address: string = req.params.address; 
        res.status(200).send(address);
    } catch (error) {
        console.error('Error fetching market by query:');
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export {airdrop, createMarket, getMarketAddress}
