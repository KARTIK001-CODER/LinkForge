import { Router } from 'express';
import { createLink } from './controllers/createLink.controller';
import { getLinks } from './controllers/getLinks.controller';
import { getLink } from './controllers/getLink.controller';

const router = Router();

router.post('/', createLink);
router.get('/', getLinks);
router.get('/:alias', getLink);

export default router;
