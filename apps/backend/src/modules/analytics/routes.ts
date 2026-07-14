import { Router } from 'express';
import { AnalyticsController } from './controllers/analytics.controller';

import { AuthMiddleware } from '../auth/middleware/auth.middleware';

const router = Router();

router.get('/:linkId/summary', AuthMiddleware.requireAuth, AnalyticsController.getSummary);
router.get('/:linkId/timeseries', AuthMiddleware.requireAuth, AnalyticsController.getTimeseries);
router.get('/:linkId/breakdown', AuthMiddleware.requireAuth, AnalyticsController.getBreakdown);
router.get('/:linkId/realtime', AuthMiddleware.requireAuth, AnalyticsController.getRealtime);
router.post('/:linkId/export', AuthMiddleware.requireAuth, AnalyticsController.requestExport);
router.get('/export/:jobId', AuthMiddleware.requireAuth, AnalyticsController.getExportStatus);

export default router;
