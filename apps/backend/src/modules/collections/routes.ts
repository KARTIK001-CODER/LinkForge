import { Router } from 'express';
import {
  createCollection,
  getCollections,
  getCollection,
  updateCollection,
  deleteCollection,
} from './controllers/collection.controller';

const router = Router();

router.post('/', createCollection);
router.get('/', getCollections);
router.get('/:id', getCollection);
router.patch('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;
