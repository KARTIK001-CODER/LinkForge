import { Router } from 'express';
import { createLink } from './controllers/createLink.controller';
import { getLinks } from './controllers/getLinks.controller';

const router = Router();

router.post('/', createLink);
router.get('/', getLinks);

export default router;
