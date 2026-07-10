import express from 'express';
import cors from 'cors';
import linkRoutes from './modules/links/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/links', linkRoutes);

export default app;
