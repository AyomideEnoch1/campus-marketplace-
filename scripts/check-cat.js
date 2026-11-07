const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    }
  });
  console.log('=== CATEGORIES IN DB ===');
  categories.forEach(c => {
    console.log(`- ${c.name} | slug: "${c.slug}" | id: "${c.id}" | product count: ${c._count.products}`);
  });

  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
      vendor: { select: { storeName: true, status: true } }
    }
  });
  console.log(`\n=== PRODUCTS IN DB (${products.length}) ===`);
  products.forEach(p => {
    console.log(`- [${p.status}] "${p.title}" | Category: ${p.category?.name} (${p.category?.slug}) | Vendor: ${p.vendor?.storeName} (${p.vendor?.status})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
