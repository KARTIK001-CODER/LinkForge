import prisma from './src/lib/prisma';

async function main() {
  const links = await prisma.smartLink.findMany({
    select: {
      id: true,
      alias: true,
      destinationUrl: true,
      status: true,
      clicks: true,
    },
    take: 20,
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.table(links);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
