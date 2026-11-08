const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Campus Marketplace Seeding ---');

  // 1. Seed Site Settings
  console.log('Seeding site settings...');
  const defaultSettings = [
    { key: 'site_name', value: 'UniTrade Campus Marketplace', description: 'Platform branding name' },
    { key: 'site_tagline', value: 'Buy, sell and connect with verified students on your campus', description: 'Hero tagline' },
    { key: 'primary_color', value: '#10B981', description: 'Default accent color' },
    { key: 'vendor_approval_required', value: 'true', description: 'Require admin approval before vendors can publish' },
    { key: 'contact_email', value: 'support@unitrade.ng', description: 'Support contact email' },
    { key: 'contact_whatsapp', value: '+2348000000000', description: 'Support WhatsApp' },
    { key: 'platform_fee_percent', value: '5', description: 'Platform commission fee in percentage' },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 2. Seed Admin User
  console.log('Seeding super admin...');
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campustrade.ng' },
    update: {
      role: 'ADMIN',
      fullName: 'Super Administrator',
    },
    create: {
      email: 'admin@campustrade.ng',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      fullName: 'Super Administrator',
      phone: '+2348011112233',
      emailVerified: new Date(),
    },
  });
  console.log(`Admin account created: ${adminUser.email}`);

  // 3. Seed Campuses (3 Campuses)
  console.log('Seeding campuses...');
  const campusesData = [
    { name: 'University of Lagos (UNILAG)', slug: 'unilag', city: 'Akoka, Lagos', state: 'Lagos' },
    { name: 'University of Ibadan (UI)', slug: 'ui', city: 'Ibadan', state: 'Oyo' },
    { name: 'Obafemi Awolowo University (OAU)', slug: 'oau', city: 'Ile-Ife', state: 'Osun' },
  ];

  const campuses = [];
  for (const c of campusesData) {
    const campus = await prisma.campus.upsert({
      where: { slug: c.slug },
      update: { name: c.name, city: c.city, state: c.state, isActive: true },
      create: c,
    });
    campuses.push(campus);

    // Seed campus settings
    await prisma.campusSetting.upsert({
      where: { campusId: campus.id },
      update: { guestVendorsEnabled: true, guestVendorCap: 50 },
      create: {
        campusId: campus.id,
        guestVendorsEnabled: true,
        guestVendorCap: 50,
      },
    });
  }

  // Seed Safe Meetup Points
  console.log('Seeding safe meetup points...');
  const safePointsMap = {
    unilag: [
      { name: 'UNILAG Main Library Quad & Foyer', description: 'High-traffic daytime public zone directly in front of Main Library' },
      { name: 'Student Union Building (SUB) Concourse', description: 'Central student hub with security personnel present' },
      { name: 'Campus Main Gate Security Hub', description: 'Designated visitor and off-campus exchange bay at University Road' },
      { name: 'Faculty of Arts Covered Car Park Walkway', description: 'Visible well-lit pedestrian walkway during daytime hours' },
    ],
    ui: [
      { name: 'Kenneth Dike Library Front Steps', description: 'Central open-air meeting plaza in front of the University Library' },
      { name: 'UI SUB Amphitheatre / Food Court', description: 'Bustling student social center with ample seating and daylight visibility' },
      { name: 'UI Main Gate Visitor Security Post', description: 'Designated safe pickup post beside the primary entrance gate' },
    ],
    oau: [
      { name: 'Hezekiah Oluwasanmi Library Steps', description: 'Iconic central campus meeting landmark with high foot traffic' },
      { name: 'Ken Saro-Wiwa (SUB) Building Frontage', description: 'Student Union building forecourt with active campus surveillance' },
      { name: 'OAU Campus Main Gate Pavilion', description: 'Safe transfer area located at the university main access gates' },
    ],
  };

  for (const campus of campuses) {
    const points = safePointsMap[campus.slug] || [];
    for (const p of points) {
      const existingPoint = await prisma.safeMeetupPoint.findFirst({
        where: { campusId: campus.id, name: p.name },
      });
      if (!existingPoint) {
        await prisma.safeMeetupPoint.create({
          data: {
            campusId: campus.id,
            name: p.name,
            description: p.description,
            active: true,
          },
        });
      }
    }
  }

  // 4. Seed Categories (8 Categories with subcategories)
  console.log('Seeding categories...');
  const categoriesData = [
    {
      name: 'Fashion & Apparel',
      slug: 'fashion',
      icon: 'Shirt',
      description: 'Trendy clothing, sneakers, thrift items, and jewelry',
      subcategories: [
        { name: "Men's Wear", slug: 'mens-wear' },
        { name: "Women's Wear", slug: 'womens-wear' },
        { name: 'Shoes & Sneakers', slug: 'shoes-sneakers' },
      ],
    },
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      icon: 'Smartphone',
      description: 'Laptops, phones, accessories, power banks, and chargers',
      subcategories: [
        { name: 'Phones & Tablets', slug: 'phones-tablets' },
        { name: 'Laptops & Computers', slug: 'laptops-computers' },
        { name: 'Audio & Accessories', slug: 'audio-accessories' },
      ],
    },
    {
      name: 'Hostel & Living Essentials',
      slug: 'hostel-essentials',
      icon: 'Home',
      description: 'Fans, bedding, kitchenware, laundry baskets, study lamps',
      subcategories: [
        { name: 'Kitchen & Cooking', slug: 'kitchen-cooking' },
        { name: 'Bedding & Furniture', slug: 'bedding-furniture' },
        { name: 'Hostel Appliances', slug: 'hostel-appliances' },
      ],
    },
    {
      name: 'Books & Academic Materials',
      slug: 'books-academics',
      icon: 'BookOpen',
      description: 'Textbooks, past questions, lecture notes, drafting kits',
      subcategories: [
        { name: 'Course Textbooks', slug: 'course-textbooks' },
        { name: 'Notes & Past Questions', slug: 'past-questions' },
        { name: 'Stationery & Drafting', slug: 'stationery' },
      ],
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty-care',
      icon: 'Sparkles',
      description: 'Skincare, perfumes, hair care, grooming essentials',
      subcategories: [
        { name: 'Fragrances & Perfumes', slug: 'fragrances' },
        { name: 'Hair & Grooming', slug: 'hair-grooming' },
        { name: 'Skincare & Cosmetics', slug: 'skincare' },
      ],
    },
    {
      name: 'Food & Groceries',
      slug: 'food-groceries',
      icon: 'Utensils',
      description: 'Snacks, packaged food, instant noodles, beverages, cakes',
      subcategories: [
        { name: 'Snacks & Pastries', slug: 'snacks-pastries' },
        { name: 'Groceries & Provisions', slug: 'provisions' },
      ],
    },
    {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      icon: 'Dumbbell',
      description: 'Jerseys, gym wear, jump ropes, resistance bands, cleats',
      subcategories: [
        { name: 'Club Jerseys', slug: 'club-jerseys' },
        { name: 'Gym & Fitness Gear', slug: 'fitness-gear' },
      ],
    },
    {
      name: 'Campus Services',
      slug: 'services',
      icon: 'Briefcase',
      description: 'Graphics, photo shoots, hair styling, typing, tutoring',
      subcategories: [
        { name: 'Tech & Design', slug: 'tech-design' },
        { name: 'Hair & Barbing', slug: 'hair-barbing' },
      ],
    },
  ];

  const categoryMap = {};
  for (const catData of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: { name: catData.name, icon: catData.icon, description: catData.description },
      create: {
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon,
        description: catData.description,
      },
    });
    categoryMap[catData.slug] = parent;

    for (const sub of catData.subcategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id },
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: parent.id,
        },
      });
    }
  }

  // 5. Seed 5 Sample Vendors
  console.log('Seeding 5 vendors...');
  const vendorSeedProfiles = [
    {
      email: 'kicks@unilag.ng',
      fullName: 'Tobi Adebayo',
      storeName: 'Unilag Kicks & Apparel',
      slug: 'unilag-kicks',
      campusIndex: 0, // UNILAG
      layout: 'grid',
      brandColor: '#2563EB',
      whatsapp: '+2348023456781',
      faculty: 'Business Administration',
      department: 'Finance',
      storeDescription: 'Premier campus provider of authentic sneakers, streetwear, and vintage denim at student-friendly rates.',
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80',
    },
    {
      email: 'techhub@ui.ng',
      fullName: 'Chidinma Okeke',
      storeName: 'Ibadan Tech Point',
      slug: 'ibadan-tech-point',
      campusIndex: 1, // UI
      layout: 'showcase',
      brandColor: '#059669',
      whatsapp: '+2348034567892',
      faculty: 'Technology',
      department: 'Computer Science',
      storeDescription: 'Tested and trusted gadgets: certified UK-used iPhones, MacBooks, fast-charging power banks, and flash drives.',
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
    },
    {
      email: 'vintage@oau.ng',
      fullName: 'Korede Adeleke',
      storeName: 'OAU Thrift & Vintage Boutique',
      slug: 'oau-thrift-boutique',
      campusIndex: 2, // OAU
      layout: 'lookbook',
      brandColor: '#D97706',
      whatsapp: '+2348045678903',
      faculty: 'Arts',
      department: 'Dramatic Arts',
      storeDescription: 'Hand-picked vintage shirts, oversized graphic tees, corduroy jackets, and tote bags for the stylish student.',
      logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    },
    {
      email: 'hostelmart@unilag.ng',
      fullName: 'Faruk Bello',
      storeName: 'Hostel Living Essentials Mart',
      slug: 'hostel-essentials-mart',
      campusIndex: 0, // UNILAG
      layout: 'list',
      brandColor: '#7C3AED',
      whatsapp: '+2348056789014',
      faculty: 'Engineering',
      department: 'Electrical Engineering',
      storeDescription: 'Everything you need for your hostel room: rechargeable mist fans, electric kettles, extension boxes, and storage tubs.',
      logo: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80',
    },
    {
      email: 'academics@ui.ng',
      fullName: 'Blessing Emmanuel',
      storeName: 'Campus Book Den & Stationary',
      slug: 'campus-book-den',
      campusIndex: 1, // UI
      layout: 'grid',
      brandColor: '#DC2626',
      whatsapp: '+2348067890125',
      faculty: 'Basic Medical Sciences',
      department: 'Physiology',
      storeDescription: 'Affordable medical and engineering textbooks, lab coats, dissection kits, scientific calculators, and course summaries.',
      logo: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
    },
  ];

  const vendorHash = await bcrypt.hash('VendorPassword123!', 10);
  const createdVendors = [];

  for (const v of vendorSeedProfiles) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: { role: 'VENDOR', fullName: v.fullName },
      create: {
        email: v.email,
        passwordHash: vendorHash,
        role: 'VENDOR',
        fullName: v.fullName,
        phone: v.whatsapp,
        emailVerified: new Date(),
      },
    });

    const vendor = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {
        storeName: v.storeName,
        slug: v.slug,
        campusId: campuses[v.campusIndex].id,
        layout: v.layout,
        brandColor: v.brandColor,
        whatsapp: v.whatsapp,
        status: 'APPROVED',
        storeDescription: v.storeDescription,
        logo: v.logo,
        banner: v.banner,
        faculty: v.faculty,
        department: v.department,
      },
      create: {
        userId: user.id,
        storeName: v.storeName,
        slug: v.slug,
        campusId: campuses[v.campusIndex].id,
        layout: v.layout,
        brandColor: v.brandColor,
        whatsapp: v.whatsapp,
        status: 'APPROVED',
        storeDescription: v.storeDescription,
        logo: v.logo,
        banner: v.banner,
        faculty: v.faculty,
        department: v.department,
      },
    });
    createdVendors.push(vendor);
  }

  // 6. Seed 20 Sample Products
  console.log('Seeding 20 products across vendors...');
  const sampleProductsData = [
    // Vendor 0 (Unilag Kicks & Apparel)
    {
      vendorIdx: 0,
      catSlug: 'fashion',
      title: 'Nike Air Jordan 1 Retro High (Bred Toe)',
      slug: 'nike-air-jordan-1-retro-high-bred-toe',
      price: 38500,
      comparePrice: 45000,
      stock: 5,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Brand new in box with extra laces. Top-tier quality, comfortable cushioning, perfect for campus flexing.',
      tags: 'shoes,sneakers,nike,jordan,fashion',
      images: [
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
        'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
      ],
    },
    {
      vendorIdx: 0,
      catSlug: 'fashion',
      title: 'New Balance 550 White & Green Sneakers',
      slug: 'new-balance-550-white-green',
      price: 32000,
      comparePrice: 38000,
      stock: 4,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Clean classic aesthetic sneakers. Fits true to size, premium leather upper with rubber cupsole.',
      tags: 'sneakers,shoes,casual,newbalance',
      images: [
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
      ],
    },
    {
      vendorIdx: 0,
      catSlug: 'fashion',
      title: 'Oversized Heavyweight Cotton Graphic Hoodie',
      slug: 'oversized-heavyweight-cotton-hoodie',
      price: 16500,
      comparePrice: 20000,
      stock: 12,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: '450 GSM pure cotton French terry fleece. Perfect for chilly lecture theatres and hostel lounging.',
      tags: 'hoodie,streetwear,winter,cotton',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
      ],
    },
    {
      vendorIdx: 0,
      catSlug: 'fashion',
      title: 'Cargo Parachute Pants - Khaki Beige',
      slug: 'cargo-parachute-pants-khaki-beige',
      price: 14000,
      comparePrice: 17500,
      stock: 8,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Adjustable drawstring waist and ankle toggles. 6 deep utility pockets for phone, keys, and ID card.',
      tags: 'trousers,cargo,streetwear,fashion',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
      ],
    },

    // Vendor 1 (Ibadan Tech Point)
    {
      vendorIdx: 1,
      catSlug: 'electronics',
      title: 'Apple iPhone 13 128GB (Factory Unlocked, 89% BH)',
      slug: 'apple-iphone-13-128gb-blue',
      price: 395000,
      comparePrice: 430000,
      stock: 2,
      condition: 'USED_LIKE_NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Clean UK used iPhone 13 in Midnight Blue. Face ID and True Tone active, clean IMEI, warranty included.',
      tags: 'iphone,apple,gadgets,phone,tech',
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      ],
    },
    {
      vendorIdx: 1,
      catSlug: 'electronics',
      title: 'Oraimo 30,000mAh Powerbox Fast Charging Power Bank',
      slug: 'oraimo-30000mah-powerbox-power-bank',
      price: 24500,
      comparePrice: 28000,
      stock: 15,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Multi-port fast charging power bank with LED torch and digital display. Essential for campus power outages.',
      tags: 'powerbank,oraimo,charger,electronics',
      images: [
        'https://images.unsplash.com/photo-1609592424302-3c139b4b0e77?w=800&q=80',
      ],
    },
    {
      vendorIdx: 1,
      catSlug: 'electronics',
      title: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm4-wireless-headphones',
      price: 165000,
      comparePrice: 190000,
      stock: 3,
      condition: 'USED_LIKE_NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Industry-leading noise cancellation. 30-hour battery life, touch controls, perfect for studying in crowded halls.',
      tags: 'headphones,sony,audio,bluetooth',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      ],
    },
    {
      vendorIdx: 1,
      catSlug: 'electronics',
      title: 'MacBook Air M1 256GB / 8GB RAM Space Gray',
      slug: 'macbook-air-m1-space-gray',
      price: 520000,
      comparePrice: 560000,
      stock: 2,
      condition: 'USED_LIKE_NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Very clean Apple MacBook Air M1. Cycle count 84, comes with genuine 30W USB-C brick and braided cable.',
      tags: 'laptop,macbook,apple,coding,academics',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      ],
    },

    // Vendor 2 (OAU Thrift & Vintage Boutique)
    {
      vendorIdx: 2,
      catSlug: 'fashion',
      title: '90s Retro Harajuku Oversized Graphic Tee',
      slug: '90s-retro-harajuku-oversized-graphic-tee',
      price: 7500,
      comparePrice: 9500,
      stock: 10,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Acid-wash vintage finish tee. Breathable 100% cotton with high-definition DTG silkscreen print.',
      tags: 'thrift,vintage,tee,graphic,fashion',
      images: [
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
      ],
    },
    {
      vendorIdx: 2,
      catSlug: 'fashion',
      title: 'Vintage Corduroy Trucker Jacket - Rust Brown',
      slug: 'vintage-corduroy-trucker-jacket-rust',
      price: 18500,
      comparePrice: 22000,
      stock: 4,
      condition: 'USED_LIKE_NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Super aesthetic vintage corduroy jacket with sherpa collar lining. One-of-a-kind campus grail piece.',
      tags: 'vintage,jacket,corduroy,outerwear',
      images: [
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      ],
    },
    {
      vendorIdx: 2,
      catSlug: 'fashion',
      title: 'Canvas Tote Bag with Botanical Minimalist Print',
      slug: 'canvas-tote-bag-botanical-print',
      price: 4500,
      comparePrice: 6000,
      stock: 20,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Sturdy 14oz canvas bag with zippered pocket inside. Fits 14-inch laptops, spiral notebooks, and water bottles.',
      tags: 'totebag,accessories,campus,books',
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
      ],
    },
    {
      vendorIdx: 2,
      catSlug: 'fashion',
      title: 'Y2K Chunky Silver Chain Necklace & Ring Set',
      slug: 'y2k-chunky-silver-chain-ring-set',
      price: 6000,
      comparePrice: 8000,
      stock: 15,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Stainless steel curb Cuban chain necklace that does not tarnish or fade in shower. Includes 2 matching signet rings.',
      tags: 'jewelry,chain,accessories,silver',
      images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
      ],
    },

    // Vendor 3 (Hostel Living Essentials Mart)
    {
      vendorIdx: 3,
      catSlug: 'hostel-essentials',
      title: 'Lontor 16-Inch Rechargeable Stand Mist Fan with Remote',
      slug: 'lontor-16-inch-rechargeable-stand-fan',
      price: 48000,
      comparePrice: 55000,
      stock: 6,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Strong breeze with mist sprayer and built-in LED night light. Lasts up to 10 hours on low speed during NEPA blackout.',
      tags: 'fan,rechargeable,hostel,living,comfort',
      images: [
        'https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=800&q=80',
      ],
    },
    {
      vendorIdx: 3,
      catSlug: 'hostel-essentials',
      title: '2.0L Stainless Steel Fast-Boil Electric Kettle',
      slug: '2l-stainless-steel-electric-kettle',
      price: 8500,
      comparePrice: 11000,
      stock: 14,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: '1500W rapid boil heating element with auto shut-off protection. Low wattage friendly for campus electrical outlets.',
      tags: 'kettle,kitchen,hostel,food,essentials',
      images: [
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
      ],
    },
    {
      vendorIdx: 3,
      catSlug: 'hostel-essentials',
      title: 'Collapsible Laundry Hamper Basket with Handles',
      slug: 'collapsible-laundry-hamper-basket',
      price: 5500,
      comparePrice: 7000,
      stock: 25,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Waterproof fabric, heavy-duty aluminium handles with soft foam grips. Folds flat when not in use to save hostel space.',
      tags: 'laundry,hostel,storage,clean',
      images: [
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80',
      ],
    },
    {
      vendorIdx: 3,
      catSlug: 'hostel-essentials',
      title: '6-Gang Surge Protected Heavy Duty Extension Socket (5M)',
      slug: '6-gang-surge-protected-extension-socket',
      price: 9000,
      comparePrice: 12000,
      stock: 18,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Individual on/off switches with LED indicators. High-grade copper wiring with fire-retardant outer shell.',
      tags: 'extension,power,hostel,electronics',
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
      ],
    },

    // Vendor 4 (Campus Book Den & Stationary)
    {
      vendorIdx: 4,
      catSlug: 'books-academics',
      title: 'Guyton and Hall Textbook of Medical Physiology (14th Ed)',
      slug: 'guyton-and-hall-medical-physiology-14th-ed',
      price: 22000,
      comparePrice: 28000,
      stock: 5,
      condition: 'USED_GOOD',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Hardcover medical textbook in excellent shape. Clean pages with minimal pencil highlights. Indispensable for MBBS students.',
      tags: 'books,medicine,physiology,textbook,ui',
      images: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&q=80',
      ],
    },
    {
      vendorIdx: 4,
      catSlug: 'books-academics',
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      slug: 'casio-fx-991ex-classwiz-scientific-calculator',
      price: 19500,
      comparePrice: 24000,
      stock: 8,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: true,
      description: 'Original Casio scientific calculator with high-resolution LCD display and QR code function. Approved for university exams.',
      tags: 'calculator,casio,engineering,math,stationery',
      images: [
        'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&q=80',
      ],
    },
    {
      vendorIdx: 4,
      catSlug: 'books-academics',
      title: 'Engineering Technical Drawing Board with T-Square & Bag',
      slug: 'engineering-drawing-board-t-square-set',
      price: 26000,
      comparePrice: 32000,
      stock: 4,
      condition: 'USED_LIKE_NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'Full A2 size smooth beech wood drawing board, 60cm acrylic T-square, set squares, and waterproof shoulder carry case.',
      tags: 'engineering,drawing,tsquare,architecture',
      images: [
        'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80',
      ],
    },
    {
      vendorIdx: 4,
      catSlug: 'books-academics',
      title: '100% Pure White Cotton Lab Coat (All Sizes S - XXL)',
      slug: 'pure-white-cotton-science-lab-coat',
      price: 7500,
      comparePrice: 9500,
      stock: 30,
      condition: 'NEW',
      status: 'PUBLISHED',
      isFeatured: false,
      description: 'High-density laboratory coat with snap-button front, deep pockets, and pen holder. Mandatory for chemistry and biology practicals.',
      tags: 'labcoat,science,practical,clothing',
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      ],
    },
  ];

  for (const p of sampleProductsData) {
    const vendor = createdVendors[p.vendorIdx];
    const category = categoryMap[p.catSlug];

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        condition: p.condition,
        status: p.status,
        isFeatured: p.isFeatured,
        description: p.description,
        tags: p.tags,
      },
      create: {
        vendorId: vendor.id,
        categoryId: category.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        condition: p.condition,
        status: p.status,
        isFeatured: p.isFeatured,
        description: p.description,
        tags: p.tags,
      },
    });

    // Seed product images
    for (let i = 0; i < p.images.length; i++) {
      const imgUrl = p.images[i];
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: product.id, position: i },
      });
      if (!existingImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imgUrl,
            position: i,
            altText: `${p.title} view ${i + 1}`,
          },
        });
      }
    }
  }

  // 7. Seed CMS Homepage Sections & CMS Pages
  console.log('Seeding CMS sections and static pages...');
  const sections = [
    {
      sectionKey: 'hero',
      title: 'The Trusted Marketplace for Campus Life',
      subtitle: 'Buy textbooks, gadgets, hostel essentials, and thrift fashion directly from verified student vendors across campuses.',
      sortOrder: 1,
      isVisible: true,
      contentJson: JSON.stringify({
        badge: '🚀 Active on 3+ Campuses in Nigeria',
        primaryCtaText: 'Browse Marketplace',
        primaryCtaLink: '/shop',
        secondaryCtaText: 'Become a Student Vendor',
        secondaryCtaLink: '/vendor/register',
      }),
    },
    {
      sectionKey: 'featured_vendors',
      title: 'Top Student Vendors',
      subtitle: 'Support student entrepreneurs with fast on-campus deliveries and pickup points.',
      sortOrder: 2,
      isVisible: true,
      contentJson: JSON.stringify({ maxCount: 6 }),
    },
    {
      sectionKey: 'categories',
      title: 'Popular Campus Categories',
      subtitle: 'Find everything you need for lectures, hostel life, and personal style.',
      sortOrder: 3,
      isVisible: true,
      contentJson: JSON.stringify({ showIcons: true }),
    },
    {
      sectionKey: 'new_arrivals',
      title: 'Fresh Campus Drops',
      subtitle: 'Recently listed items from student sellers at UNILAG, UI, and OAU.',
      sortOrder: 4,
      isVisible: true,
      contentJson: JSON.stringify({ limit: 8 }),
    },
  ];

  for (const s of sections) {
    await prisma.homepageSection.upsert({
      where: { sectionKey: s.sectionKey },
      update: {
        title: s.title,
        subtitle: s.subtitle,
        sortOrder: s.sortOrder,
        contentJson: s.contentJson,
        isVisible: s.isVisible,
      },
      create: s,
    });
  }

  // Seed CMS Pages (About, Terms, Privacy, FAQ, Safety)
  const cmsPages = [
    {
      title: 'About Campus Marketplace',
      slug: 'about',
      content: `<h2>About Our Platform</h2><p>Campus Marketplace is a dedicated multi-vendor e-commerce platform built specifically for university students across Nigeria. We empower student sellers to launch online stores, reach verified campus buyers, and arrange easy on-campus pickups and fast delivery.</p>`,
      isPublished: true,
    },
    {
      title: 'Terms and Conditions',
      slug: 'terms',
      content: `<h2>Platform Terms of Use</h2><p>By using Campus Marketplace, buyers and vendors agree to conduct transactions in good faith. Vendors are responsible for listing genuine goods and honouring product conditions.</p>`,
      isPublished: true,
    },
    {
      title: 'Campus Safety & Anti-Scam Guide',
      slug: 'safety',
      content: `<h2>Safe Trading Tips on Campus</h2><p>Always meet in well-lit, public campus locations (such as faculty quadrangles, libraries, or student union buildings) to inspect items before finalizing payment.</p>`,
      isPublished: true,
    },
  ];

  for (const page of cmsPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content, isPublished: page.isPublished },
      create: page,
    });
  }

  console.log('--- Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
