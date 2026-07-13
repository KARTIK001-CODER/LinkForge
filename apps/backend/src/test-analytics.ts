import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to DB to check Analytics...");
  try {
    const linkCount = await prisma.smartLink.count();
    const eventCount = await prisma.analyticsEvent.count();
    const dailyCount = await prisma.dailyMetrics.count();
    const aggCount = await prisma.aggregatedMetrics.count();
    
    console.log(`Links: ${linkCount}`);
    console.log(`AnalyticsEvents: ${eventCount}`);
    console.log(`DailyMetrics: ${dailyCount}`);
    console.log(`AggregatedMetrics: ${aggCount}`);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
