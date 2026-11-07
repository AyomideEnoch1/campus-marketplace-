const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendorProfile.findMany({
    include: {
      user: { select: { email: true, fullName: true, role: true } },
      campus: { select: { name: true, slug: true } },
      _count: { select: { products: true } }
    }
  });

  console.log('=== VENDORS IN DB ===');
  vendors.forEach(v => {
    console.log(`- ${v.storeName} (${v.slug}) | Status: ${v.status} | User: ${v.user?.email} (${v.user?.role}) | Campus: ${v.campus?.name} | Products: ${v._count.products}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
