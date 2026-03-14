import { PrismaClient, ProductCategory, RecommendationType, StoreType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.recommendation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.garmentAsset.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productAnalytics.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  const goPlanet = await prisma.store.create({
    data: {
      name: "Go Planet",
      type: StoreType.GO_PLANET,
      location: "Main Boulevard",
      phone: "+91-90000-11111",
    },
  });

  const brandMark = await prisma.store.create({
    data: {
      name: "Brand Mark",
      type: StoreType.BRAND_MARK,
      location: "Royal Avenue",
      phone: "+91-90000-22222",
    },
  });

  const productData = [
    {
      name: "Regal Sherwani",
      sku: "GP-SHER-001",
      category: ProductCategory.SHERWANI,
      description: "Ivory sherwani with hand embroidery.",
      price: 22999,
      imageUrl: "/products/sherwani.svg",
      rackLocation: "A1",
      storeId: goPlanet.id,
      quantity: 5,
    },
    {
      name: "Classic Kurta",
      sku: "GP-KUR-002",
      category: ProductCategory.KURTA,
      description: "Festive kurta in soft cotton silk.",
      price: 4999,
      imageUrl: "/products/kurta.svg",
      rackLocation: "A4",
      storeId: goPlanet.id,
      quantity: 2,
    },
    {
      name: "Midnight Blazer",
      sku: "BM-BLZ-003",
      category: ProductCategory.BLAZER,
      description: "Modern blazer with slim silhouette.",
      price: 11999,
      imageUrl: "/products/blazer.svg",
      rackLocation: "B2",
      storeId: brandMark.id,
      quantity: 8,
    },
    {
      name: "Velvet Evening Dress",
      sku: "BM-DRS-004",
      category: ProductCategory.DRESS,
      description: "Royal velvet evening dress.",
      price: 15999,
      imageUrl: "/products/dress.svg",
      rackLocation: "C5",
      storeId: brandMark.id,
      quantity: 1,
    },
    {
      name: "Wedding Lehenga",
      sku: "GP-LEH-005",
      category: ProductCategory.LEHENGA,
      description: "Rich bridal lehenga with sequins.",
      price: 35999,
      imageUrl: "/products/lehenga.svg",
      rackLocation: "D1",
      storeId: goPlanet.id,
      quantity: 4,
    },
    {
      name: "Royal Brooch",
      sku: "BM-BRO-006",
      category: ProductCategory.BROOCH,
      description: "Pearl and metal statement brooch.",
      price: 1999,
      imageUrl: "/products/brooch.svg",
      rackLocation: "E2",
      storeId: brandMark.id,
      quantity: 10,
    },
    {
      name: "Classic Mojari",
      sku: "GP-FTW-007",
      category: ProductCategory.FOOTWEAR,
      description: "Traditional handcrafted footwear.",
      price: 3499,
      imageUrl: "/products/footwear.svg",
      rackLocation: "F3",
      storeId: goPlanet.id,
      quantity: 0,
    },
    {
      name: "Oud Perfume",
      sku: "BM-PRF-008",
      category: ProductCategory.PERFUME,
      description: "Long-lasting luxury oud fragrance.",
      price: 2799,
      imageUrl: "/products/perfume.svg",
      rackLocation: "P1",
      storeId: brandMark.id,
      quantity: 12,
    },
  ] as const;

  const products = [] as Awaited<ReturnType<typeof prisma.product.create>>[];

  for (const entry of productData) {
    const product = await prisma.product.create({
      data: {
        name: entry.name,
        sku: entry.sku,
        category: entry.category,
        description: entry.description,
        price: entry.price,
        imageUrl: entry.imageUrl,
        imageMimeType: "image/svg+xml",
        rackLocation: entry.rackLocation,
        storeId: entry.storeId,
        status: entry.quantity > 0 ? "ACTIVE" : "SOLD_OUT",
        isActive: true,
        lowStockThreshold: 2,
        isPreviewAllowedWhenOutOfStock: entry.quantity === 0,
      },
    });

    products.push(product);

    await prisma.inventory.create({
      data: {
        storeId: entry.storeId,
        productId: product.id,
        quantity: entry.quantity,
      },
    });

    await prisma.garmentAsset.create({
      data: {
        productId: product.id,
        originalImageUrl: entry.imageUrl,
        processedImageUrl: entry.imageUrl,
        backgroundRemoved: true,
        centered: true,
        classifiedCategory: entry.category,
        generatedTryOnAsset: `/uploads/asset-${entry.sku}.png`,
        processingNotes: "Seeded placeholder asset",
      },
    });

    await prisma.productAnalytics.create({
      data: {
        productId: product.id,
        views: Math.floor(Math.random() * 120),
        tryOns: Math.floor(Math.random() * 60),
        reservations: Math.floor(Math.random() * 24),
      },
    });
  }

  const baseCategories: ProductCategory[] = [
    ProductCategory.SHERWANI,
    ProductCategory.KURTA,
    ProductCategory.BLAZER,
    ProductCategory.DRESS,
    ProductCategory.LEHENGA,
  ];

  const recommendationCategories: ProductCategory[] = [
    ProductCategory.FOOTWEAR,
    ProductCategory.ACCESSORY,
    ProductCategory.JEWELLERY,
    ProductCategory.BROOCH,
    ProductCategory.DUPATTA,
    ProductCategory.PERFUME,
  ];

  const baseOutfits = products.filter((p) => baseCategories.includes(p.category));

  const recommendationTargets = products.filter((p) => recommendationCategories.includes(p.category));

  const defaultTypes: RecommendationType[] = [
    RecommendationType.ACCESSORY,
    RecommendationType.FOOTWEAR,
    RecommendationType.PERFUME,
    RecommendationType.JEWELLERY,
    RecommendationType.STYLING_PAIR,
  ];

  for (const base of baseOutfits) {
    for (const target of recommendationTargets) {
      const type =
        target.category === ProductCategory.FOOTWEAR
          ? RecommendationType.FOOTWEAR
          : target.category === ProductCategory.JEWELLERY || target.category === ProductCategory.BROOCH
            ? RecommendationType.JEWELLERY
            : target.category === ProductCategory.PERFUME
              ? RecommendationType.PERFUME
              : RecommendationType.ACCESSORY;

      if (!defaultTypes.includes(type)) continue;

      await prisma.recommendation.create({
        data: {
          baseProductId: base.id,
          recommendedProductId: target.id,
          type,
          score: Number((0.65 + Math.random() * 0.3).toFixed(2)),
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
