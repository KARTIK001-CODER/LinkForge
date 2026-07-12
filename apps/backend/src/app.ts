import express from 'express';
import cors from 'cors';
import linkRoutes from './modules/links/routes';
import collectionRoutes from './modules/collections/routes';
import redirectRoutes from './modules/redirect/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/links', linkRoutes);
app.use('/api/v1/collections', collectionRoutes);

// CRITICAL: Mount wildcard redirect routes LAST to avoid intercepting API routes
app.use('/', redirectRoutes);

export default app;
