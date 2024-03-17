import { Request, Response } from 'express';

//open orders
const getOpenOrders = async (req:Request, res:Response) => {
    try {
        const { owner } = req.query;
       //fetch from supabase
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error fetching open orders:');
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//trade history
const getTradeHistory = async (req:Request, res:Response) => {
    try {
        const { address } = req.query;

        // Fetch from Supabase 
        res
        .status(200)
        .json({ success: true });
    } catch (error) {
        console.error('Error fetching trade history:');
        res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
};

//event heap
const getEventHeap = async (req:Request, res:Response) => {
    try {
        const { address } = req.query;

        // Fetch from Supabase 
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error fetching event heap:');
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



export  {getOpenOrders, getTradeHistory, getEventHeap }
