import { Router } from 'express';
import {
  createCollection,
  getCollections,
  getCollection,
  updateCollection,
  deleteCollection,
} from './controllers/collection.controller';

import { AuthMiddleware } from '../auth/middleware/auth.middleware';

const router = Router();

router.post('/', AuthMiddleware.requireAuth, createCollection);
router.get('/', AuthMiddleware.requireAuth, getCollections);
router.get('/:id', AuthMiddleware.requireAuth, getCollection);
router.patch('/:id', AuthMiddleware.requireAuth, updateCollection);
router.delete('/:id', AuthMiddleware.requireAuth, deleteCollection);

export default router;
