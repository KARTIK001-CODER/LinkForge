import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Generating fake RAW analytics events...");

  const links = await prisma.smartLink.findMany();
  if (links.length === 0) {
    console.log("No links found. Please create a link first.");
    return;
  }

  const dimensions = {
    country: ['US', 'UK', 'CA', 'DE', 'FR', 'IN', 'BR'],
    deviceType: ['Desktop', 'Mobile', 'Tablet'],
    browser: ['Chrome', 'Safari', 'Firefox', 'Edge'],
    referrer: ['google.com', 'twitter.com', 'github.com', 'direct']
  };

  for (const link of links) {
    console.log(`Generating raw events for link: ${link.alias}`);

    let totalClicks = 0;
    const eventsToCreate = [];

    // Generate ~150 random events over the last 14 days
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      eventsToCreate.push({
        linkId: link.id,
        visitorId: null,
        timestamp: date,
        country: dimensions.country[Math.floor(Math.random() * dimensions.country.length)],
        deviceType: dimensions.deviceType[Math.floor(Math.random() * dimensions.deviceType.length)],
        browser: dimensions.browser[Math.floor(Math.random() * dimensions.browser.length)],
        referrer: dimensions.referrer[Math.floor(Math.random() * dimensions.referrer.length)],
      });
      totalClicks++;
    }

    // Insert events in bulk
    await prisma.analyticsEvent.createMany({
      data: eventsToCreate
    });

    // Update link total clicks
    await prisma.smartLink.update({
      where: { id: link.id },
      data: { clicks: { increment: totalClicks } }
    });
  }

  console.log("Raw analytics data seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
