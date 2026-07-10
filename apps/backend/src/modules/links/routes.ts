import { Router } from 'express';
import { createLink } from './controllers/createLink.controller';

const router = Router();

router.post('/', createLink);

export default router;
