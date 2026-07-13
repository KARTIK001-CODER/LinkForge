import app from './app';
import { AnalyticsWorker } from './modules/analytics/services/analytics.worker';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the background analytics worker
  const analyticsWorker = new AnalyticsWorker();
  analyticsWorker.start().catch(console.error);
});
