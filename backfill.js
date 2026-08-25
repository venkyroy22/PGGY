const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const properties = await prisma.property.findMany();
  if (properties.length > 0) {
    const propId = properties[0].id;
    await prisma.tenant.updateMany({
      where: { propertyId: null },
      data: { propertyId: propId }
    });
    console.log("Backfilled tenants to property", propId);
  }
}
backfill().finally(() => prisma.$disconnect());
