import { Router } from 'express';
import { AnalyticsController } from './controllers/analytics.controller';

const router = Router();

router.get('/:linkId/summary', AnalyticsController.getSummary);
router.get('/:linkId/timeseries', AnalyticsController.getTimeseries);
router.get('/:linkId/breakdown', AnalyticsController.getBreakdown);
router.get('/:linkId/realtime', AnalyticsController.getRealtime);
router.post('/:linkId/export', AnalyticsController.requestExport);
router.get('/export/:jobId', AnalyticsController.getExportStatus);

export default router;
