import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log("Connecting to DB...");
  try {
    await prisma.$connect();
    console.log("Connection successful!");
    
    console.log("Attempting query...");
    const count = await prisma.smartLink.count();
    console.log(`Query successful! Link count: ${count}`);
    
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
