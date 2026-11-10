import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

//Global middlewares
app.use(cors());
app.use(express.json());

//Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timeStamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default app;
