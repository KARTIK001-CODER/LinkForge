import { Router } from 'express';
import { createLink } from './controllers/createLink.controller';
import { getLinks } from './controllers/getLinks.controller';
import { getLink } from './controllers/getLink.controller';
import { editLink } from './controllers/editLink.controller';
import { archiveLink, restoreLink, deleteLink } from './controllers/lifecycle.controller';

const router = Router();

router.post('/', createLink);
router.get('/', getLinks);
router.get('/:alias', getLink);
router.patch('/:id', editLink);
router.patch('/:id/archive', archiveLink);
router.patch('/:id/restore', restoreLink);
router.delete('/:id', deleteLink);

export default router;
