const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. APPROVING DIVINE STORE & ACTIVATING BREAD ---');
  const divineStore = await prisma.vendorProfile.findFirst({
    where: { slug: 'divine-store' },
    include: { products: true }
  });

  if (divineStore) {
    await prisma.vendorProfile.update({
      where: { id: divineStore.id },
      data: {
        status: 'APPROVED',
        storeDescription: 'Fresh campus bakery, sliced bread, pastries, and daily student groceries delivered to your hall.',
        logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=80',
        whatsapp: '+2348123456789',
      }
    });

    // Update the existing "Bread" product to be published with a great image and description
    const breadProduct = divineStore.products.find(p => p.title.toLowerCase().includes('bread'));
    if (breadProduct) {
      await prisma.product.update({
        where: { id: breadProduct.id },
        data: {
          title: 'Fresh Butter Loaf Bread (Campus Bakery Special)',
          status: 'PUBLISHED',
          price: 1200,
          comparePrice: 1400,
          stock: 25,
          condition: 'NEW',
          isFeatured: true,
          description: 'Soft, sweet, and freshly baked daily on campus. Perfect with tea, fried eggs, or beans. Packed sealed in food-grade wrapping.',
          tags: 'bread,bakery,food,groceries,breakfast',
        }
      });

      // Ensure it has product image
      await prisma.productImage.deleteMany({ where: { productId: breadProduct.id } });
      await prisma.productImage.create({
        data: {
          productId: breadProduct.id,
          url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          position: 0,
        }
      });
      console.log('Approved Divine Store and published Bread product!');
    }
  }

  // Fetch all categories for lookup
  const categories = await prisma.category.findMany();
  const getCatId = (slug) => {
    const found = categories.find(c => c.slug === slug);
    if (!found) throw new Error(`Category with slug "${slug}" not found`);
    return found.id;
  };

  // Fetch approved vendors to attach new items to
  const approvedVendors = await prisma.vendorProfile.findMany({
    where: { status: 'APPROVED' },
    include: { campus: true }
  });

  const unilagVendor = approvedVendors.find(v => v.slug === 'unilag-kicks') || approvedVendors[0];
  const techVendor = approvedVendors.find(v => v.slug === 'ibadan-tech-point') || approvedVendors[0];
  const oauVendor = approvedVendors.find(v => v.slug === 'oau-thrift-boutique') || approvedVendors[0];
  const hostelVendor = approvedVendors.find(v => v.slug === 'hostel-essentials-mart') || approvedVendors[0];
  const bookVendor = approvedVendors.find(v => v.slug === 'campus-book-den') || approvedVendors[0];
  const foodVendor = divineStore || hostelVendor;

  console.log('\n--- 2. SEEDING PRODUCTS FOR FOOD & GROCERIES, BEAUTY, SPORTS, SERVICES ---');

  const newProducts = [
    // === FOOD & GROCERIES ===
    {
      vendorId: foodVendor.id,
      categoryId: getCatId('food-groceries'),
      title: 'Carton of Indomie Instant Noodles (Super Pack 40x120g)',
      slug: 'indomie-super-pack-carton-40pcs',
      price: 14500,
      comparePrice: 16000,
      stock: 12,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Full sealed carton of original Indomie Super Pack Chicken flavour (40 pieces). Essential survival provision for exam period and semester living.',
      tags: 'indomie,noodles,carton,groceries,food,provisions',
      images: [
        'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&q=80',
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'
      ]
    },
    {
      vendorId: foodVendor.id,
      categoryId: getCatId('food-groceries'),
      title: 'Nestlé Milo Refill (400g) + Dano Full Cream Milk Powder (360g)',
      slug: 'milo-dano-milk-combo-pack',
      price: 5200,
      comparePrice: 5800,
      stock: 20,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Classic student breakfast combo. Rich chocolate malt Milo plus creamy Dano instant powdered milk. Perfect for morning tea and midnight study sessions.',
      tags: 'milo,milk,tea,breakfast,groceries,provisions',
      images: [
        'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=80'
      ]
    },
    {
      vendorId: foodVendor.id,
      categoryId: getCatId('food-groceries'),
      title: 'Golden Morn Maize & Soya Cereal (Family Pack 900g)',
      slug: 'golden-morn-cereal-900g',
      price: 4300,
      comparePrice: 4800,
      stock: 15,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Quick nutritious campus breakfast with whole grain maize and soya. Fortified with vitamins and iron.',
      tags: 'goldenmorn,cereal,food,breakfast,groceries',
      images: [
        'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=800&q=80'
      ]
    },
    {
      vendorId: foodVendor.id,
      categoryId: getCatId('food-groceries'),
      title: 'Campus Cafe Fresh Meat Pie & Chilled Juice Box Combo',
      slug: 'meat-pie-chilled-juice-combo',
      price: 1800,
      comparePrice: 2200,
      stock: 30,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Warm golden pastry stuffed with seasoned minced beef and potatoes, paired with a chilled 500ml fruit juice. Delivered to your faculty or hall.',
      tags: 'meatpie,pastry,snacks,juice,lunch,food',
      images: [
        'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80'
      ]
    },

    // === BEAUTY & PERSONAL CARE ===
    {
      vendorId: oauVendor.id,
      categoryId: getCatId('beauty-care'),
      title: 'Zara Tobacco Collection Rich Warm Dural Eau De Parfum (100ml)',
      slug: 'zara-tobacco-collection-edp-100ml',
      price: 24000,
      comparePrice: 28000,
      stock: 6,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Warm, magnetic fragrance featuring notes of honey, dark vanilla, and cedarwood. Long-lasting scent projection ideal for lectures and campus events.',
      tags: 'perfume,fragrance,zara,beauty,cologne',
      images: [
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80'
      ]
    },
    {
      vendorId: hostelVendor.id,
      categoryId: getCatId('beauty-care'),
      title: 'Kemei Professional Cordless Hair & Beard Trimmer Clipper',
      slug: 'kemei-cordless-hair-clipper-trimmer',
      price: 13500,
      comparePrice: 16500,
      stock: 8,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Rechargeable cordless hair and beard trimmer with stainless steel blades, LCD battery percentage indicator, and 4 guard attachments (1mm - 4mm).',
      tags: 'clipper,grooming,barber,hair,shaving,kemei',
      images: [
        'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80'
      ]
    },
    {
      vendorId: oauVendor.id,
      categoryId: getCatId('beauty-care'),
      title: 'CeraVe Foaming Facial Cleanser for Normal to Oily Skin (236ml)',
      slug: 'cerave-foaming-facial-cleanser-236ml',
      price: 11500,
      comparePrice: 13000,
      stock: 10,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Original US-formulated dermatological cleanser with ceramides and hyaluronic acid. Deeply cleanses excess oil without disrupting skin barrier.',
      tags: 'cerave,skincare,cleanser,beauty,face',
      images: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80'
      ]
    },
    {
      vendorId: oauVendor.id,
      categoryId: getCatId('beauty-care'),
      title: 'Nivea Radiant & Beauty Even Glow Body Lotion (400ml)',
      slug: 'nivea-radiant-beauty-even-glow-400ml',
      price: 4500,
      comparePrice: 5200,
      stock: 18,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Deep nourishing lotion enriched with 5 natural oils and 95% pure Vitamin C. Formulated specially for melanin-rich African skin.',
      tags: 'nivea,bodylotion,skincare,beauty,cream',
      images: [
        'https://images.unsplash.com/photo-1608248597359-5613521255e2?w=800&q=80'
      ]
    },

    // === SPORTS & FITNESS ===
    {
      vendorId: unilagVendor.id,
      categoryId: getCatId('sports-fitness'),
      title: 'Arsenal FC 2024/2025 Home Jersey (Player Edition, Sizes S-XXL)',
      slug: 'arsenal-home-jersey-2024-2025',
      price: 14500,
      comparePrice: 17000,
      stock: 14,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Authentic breathable moisture-wicking fabric with embroidered club badge. Available in all adult sizes for inter-faculty games and weekend viewings.',
      tags: 'jersey,arsenal,football,sports,club,premierleague',
      images: [
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80'
      ]
    },
    {
      vendorId: unilagVendor.id,
      categoryId: getCatId('sports-fitness'),
      title: 'Real Madrid 2024/2025 Third Kit Jersey (Charcoal Gray)',
      slug: 'real-madrid-third-jersey-2024-2025',
      price: 14500,
      comparePrice: 17000,
      stock: 10,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Sleek dark edition jersey with copper branding accents. High quality aerodynamic polyester fabric.',
      tags: 'jersey,realmadrid,football,sports,championsleague',
      images: [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80'
      ]
    },
    {
      vendorId: hostelVendor.id,
      categoryId: getCatId('sports-fitness'),
      title: 'Heavy Duty 5-Level Resistance Exercise Bands Set',
      slug: 'heavy-duty-resistance-bands-set-5pcs',
      price: 7500,
      comparePrice: 9000,
      stock: 15,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Complete 5-piece latex resistance band set ranging from X-Light to X-Heavy. Includes portable mesh pouch. Perfect for hostel room calisthenics.',
      tags: 'resistancebands,fitness,workout,gym,sports,exercise',
      images: [
        'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80'
      ]
    },
    {
      vendorId: hostelVendor.id,
      categoryId: getCatId('sports-fitness'),
      title: 'Leakproof Gym Protein Shaker Bottle with Wire Mixer Ball (700ml)',
      slug: 'gym-protein-shaker-bottle-700ml',
      price: 3500,
      comparePrice: 4200,
      stock: 22,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'BPA-free durable plastic shaker with measurement markings in oz and ml. Stainless steel whisk ball guarantees clump-free protein shakes.',
      tags: 'shaker,bottle,gym,fitness,waterbottle,sports',
      images: [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80'
      ]
    },

    // === CAMPUS SERVICES ===
    {
      vendorId: techVendor.id,
      categoryId: getCatId('services'),
      title: 'Professional CV / Resume Revamp & LinkedIn Profile Optimization',
      slug: 'cv-resume-revamp-linkedin-service',
      price: 5000,
      comparePrice: 7500,
      stock: 50,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Tailored for graduating students, SIWES, and internship seekers. ATS-compliant CV redesign with keyword optimization within 24-48 hours.',
      tags: 'cv,resume,siwes,internship,writing,services,career',
      images: [
        'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80'
      ]
    },
    {
      vendorId: techVendor.id,
      categoryId: getCatId('services'),
      title: 'Brand Identity & Social Media Flyer Design (Student Business)',
      slug: 'brand-identity-flyer-graphic-design',
      price: 6500,
      comparePrice: 9000,
      stock: 30,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Professional Figma & Photoshop flyer, logo, or Instagram carousel package created by student designers for student entrepreneurs.',
      tags: 'graphics,design,flyer,logo,figma,photoshop,services',
      images: [
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80'
      ]
    },
    {
      vendorId: hostelVendor.id,
      categoryId: getCatId('services'),
      title: 'Hostel Room Deep Cleaning & Move-in Scrubbing Service',
      slug: 'hostel-room-deep-cleaning-service',
      price: 12000,
      comparePrice: 15000,
      stock: 20,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Thorough floor tile scrubbing, wall stain removal, window glass cleaning, and cobweb removal for hostel move-ins and room allocations.',
      tags: 'cleaning,hostel,service,sanitization,maintenance',
      images: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'
      ]
    }
  ];

  for (const item of newProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          price: item.price,
          comparePrice: item.comparePrice,
          stock: item.stock,
          condition: item.condition,
          status: item.status,
          isFeatured: item.isFeatured,
          description: item.description,
          tags: item.tags,
          categoryId: item.categoryId,
        }
      });
      console.log(`Updated product: "${item.title}"`);
    } else {
      const created = await prisma.product.create({
        data: {
          vendorId: item.vendorId,
          categoryId: item.categoryId,
          title: item.title,
          slug: item.slug,
          price: item.price,
          comparePrice: item.comparePrice,
          stock: item.stock,
          condition: item.condition,
          status: item.status,
          isFeatured: item.isFeatured,
          description: item.description,
          tags: item.tags,
          images: {
            create: item.images.map((url, idx) => ({
              url,
              position: idx,
            }))
          }
        }
      });
      console.log(`Created product: "${created.title}" in category slug ${categories.find(c => c.id === item.categoryId)?.slug}`);
    }
  }

  console.log('\n--- VERIFYING FINAL COUNTS PER CATEGORY ---');
  const finalCategories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      _count: {
        select: {
          products: { where: { status: 'PUBLISHED' } }
        }
      }
    }
  });

  finalCategories.forEach(c => {
    console.log(`Category: ${c.name} (${c.slug}) -> ${c._count.products} published products`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
