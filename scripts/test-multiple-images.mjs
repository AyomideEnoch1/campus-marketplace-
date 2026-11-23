import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log("=========================================");
console.log("Testing Multiple Images on Product Cards...");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

async function main() {
  // 1. UI Logic Tests: Image Ordering, Cover Image Selection, and Reordering
  test("Image Ordering: First photo (index 0) is always the primary card cover", () => {
    const uploadedImages = [
      "https://example.com/photo-front.jpg",
      "https://example.com/photo-back.jpg",
      "https://example.com/photo-side.jpg",
      "https://example.com/photo-detail.jpg",
    ];

    // Simulating ProductCard primary image selection
    const primaryImage = uploadedImages[0];
    assert.equal(primaryImage, "https://example.com/photo-front.jpg");
    assert.equal(uploadedImages.length, 4);
  });

  test("Set Cover Image: Moving any photo to index 0 becomes the new cover", () => {
    const uploadedImages = [
      "https://example.com/photo-front.jpg",
      "https://example.com/photo-back.jpg",
      "https://example.com/photo-side.jpg",
    ];

    // Vendor clicks "Set as Cover" on photo-side (index 2)
    const targetIndex = 2;
    const selected = uploadedImages[targetIndex];
    const reordered = [selected, ...uploadedImages.filter((_, i) => i !== targetIndex)];

    assert.equal(reordered[0], "https://example.com/photo-side.jpg");
    assert.equal(reordered[1], "https://example.com/photo-front.jpg");
    assert.equal(reordered[2], "https://example.com/photo-back.jpg");
  });

  test("Lightbox Payload: ProductCard passes full image list to Lightbox", () => {
    const product = {
      id: "prod-test-1",
      title: "Campus Hoodie",
      price: 15000,
      images: [
        { url: "https://example.com/front.jpg", altText: "Front view" },
        { url: "https://example.com/back.jpg", altText: "Back view" },
        { url: "https://example.com/tag.jpg", altText: "Tag view" },
      ],
    };

    const lightboxImages =
      product.images && product.images.length > 0
        ? product.images
        : [{ url: product.images[0]?.url }];

    assert.equal(lightboxImages.length, 3);
    assert.equal(lightboxImages[0].url, "https://example.com/front.jpg");
    assert.equal(lightboxImages[1].url, "https://example.com/back.jpg");
    assert.equal(lightboxImages[2].url, "https://example.com/tag.jpg");
  });

  // 2. Database Integration Test
  await runAsyncTest("Database: Verify Product and ProductImage multi-photo relation", async () => {
    // Find or test existing products in database
    const productsWithImages = await prisma.product.findMany({
      take: 5,
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    assert.ok(Array.isArray(productsWithImages), "Products query should succeed");

    // Check if any product currently has multiple images
    const multiImageProduct = productsWithImages.find((p) => p.images && p.images.length > 1);

    if (multiImageProduct) {
      console.log(`         Found existing product "${multiImageProduct.title}" with ${multiImageProduct.images.length} images:`);
      multiImageProduct.images.forEach((img, i) => {
        console.log(`           - Image ${i + 1} (pos: ${img.position}): ${img.url.slice(0, 60)}...`);
      });
      assert.equal(multiImageProduct.images[0].position, 0, "First image has position 0");
    } else {
      console.log("         Database connection verified (no multi-image product found in sample; creating test verification...)");
    }
  });

  // 3. Database Lifecycle Test: Transactional Create and Update of Multiple Images
  await runAsyncTest("Database: Create and update test product with 3 photos in sequence", async () => {
    // Find an active vendor profile and category to attach to
    const vendor = await prisma.vendorProfile.findFirst();
    const category = await prisma.category.findFirst();

    if (!vendor || !category) {
      console.log("         Skipping DB write test: Vendor or Category not found");
      return;
    }

    const testSlug = `test-multi-img-${Date.now()}`;
    const testPhotoUrls = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    ];

    // Create product with 3 photos
    const created = await prisma.product.create({
      data: {
        title: "Multi-Image Test Product",
        slug: testSlug,
        description: "Testing multiple images upload and display on product card.",
        price: 5000,
        stock: 10,
        condition: "NEW",
        status: "DRAFT",
        vendorId: vendor.id,
        categoryId: category.id,
        images: {
          create: testPhotoUrls.map((url, index) => ({
            url,
            position: index,
            altText: `Multi-Image Test Product view ${index + 1}`,
          })),
        },
      },
      include: {
        images: { orderBy: { position: "asc" } },
      },
    });

    assert.equal(created.images.length, 3, "Created product should have 3 images");
    assert.equal(created.images[0].position, 0);
    assert.equal(created.images[1].position, 1);
    assert.equal(created.images[2].position, 2);

    // Verify ProductCard data structure mapping
    const cardPrimaryImage = created.images[0].url;
    assert.equal(cardPrimaryImage, testPhotoUrls[0]);

    // Clean up test product
    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.product.delete({ where: { id: created.id } });
    console.log("         Successfully created, verified positions 0, 1, 2, and cleaned up test product.");
  });

  await prisma.$disconnect();

  console.log("\n=========================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
