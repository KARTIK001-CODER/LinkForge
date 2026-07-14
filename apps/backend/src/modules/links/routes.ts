import { Router } from 'express';
import { createLink } from './controllers/createLink.controller';
import { getLinks } from './controllers/getLinks.controller';
import { getLink } from './controllers/getLink.controller';
import { editLink } from './controllers/editLink.controller';
import { archiveLink, restoreLink, deleteLink } from './controllers/lifecycle.controller';
import { favoriteLink, unfavoriteLink } from './controllers/favorite.controller';
import { VerifyPasswordController } from './controllers/verifyPassword.controller';
import { RuleController } from './controllers/rule.controller';

import { AuthMiddleware } from '../auth/middleware/auth.middleware';

const router = Router();

// Protected Routes (Management)
router.post('/', AuthMiddleware.requireAuth, createLink);
router.get('/', AuthMiddleware.requireAuth, getLinks);
router.get('/:alias', AuthMiddleware.requireAuth, getLink);
router.patch('/:id', AuthMiddleware.requireAuth, editLink);
router.patch('/:id/archive', AuthMiddleware.requireAuth, archiveLink);
router.patch('/:id/restore', AuthMiddleware.requireAuth, restoreLink);
router.delete('/:id', AuthMiddleware.requireAuth, deleteLink);

router.patch('/:id/favorite', AuthMiddleware.requireAuth, favoriteLink);
router.patch('/:id/unfavorite', AuthMiddleware.requireAuth, unfavoriteLink);

// Smart Rules API (Protected)
router.get('/:id/rules', AuthMiddleware.requireAuth, RuleController.getRules);
router.post('/:id/rules', AuthMiddleware.requireAuth, RuleController.createRule);
router.delete('/:id/rules/:ruleId', AuthMiddleware.requireAuth, RuleController.deleteRule);

// Public Routes
router.post('/:alias/verify', VerifyPasswordController.verify);

export default router;
