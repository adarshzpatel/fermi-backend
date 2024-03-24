import express, { Application } from "express";
import cors from "cors";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Add your route handlers here

export default app;