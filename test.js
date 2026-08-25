const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function run() {
  const t = await prisma.tenant.findMany({ include: { bed: true } }); 
  console.log('Tenants:', t.length, t);
}
run().finally(() => prisma.$disconnect());
