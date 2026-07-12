import { Router } from 'express';
import { RedirectController } from './controllers/redirect.controller';

const router = Router();

// Root level param routing.
// Should be mounted LAST in app.ts to avoid intercepting actual API routes.
router.get('/:shortCode', RedirectController.handleRedirect);

export default router;
