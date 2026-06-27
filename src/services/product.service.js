const prisma = require("./prisma");
const { uploadFile, deleteFile } = require("../utils/supabaseStorage");

const MAX_PRODUCTS = 15;
const MAX_IMAGES = 3;

const createProduct = async ({ storeId, body, files }) => {
  const { name, price, description, stock, sale_price } = body;

  // 1. التأكد من الحد الأقصى للمنتجات
  const count = await prisma.product.count({ where: { storeId } });
  if (count >= MAX_PRODUCTS) throw new Error(`الحد الأقصى ${MAX_PRODUCTS} منتج`);

  if (files && files.length > MAX_IMAGES) throw new Error(`الحد الأقصى ${MAX_IMAGES} صور`);

  const uploadedImageUrls = [];

  try {
    // 2. رفع الصور لـ Supabase أولاً (ورا بعض لضمان الاستقرار الشديد)
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadFile(file, "products");
        uploadedImageUrls.push(url);
      }
    }

    // 3. هنا بقى السحر: فتح Transaction في Prisma (يا كلو ينجح يا كلو يفشل)
    const result = await prisma.$transaction(async (tx) => {
      // أ) تكريت المنتج
      const product = await tx.product.create({
        data: {
          name,
          price: parseFloat(price),
          sale_price: sale_price ? parseFloat(sale_price) : undefined,
          description,
          stock: parseInt(stock),
          storeId,
        },
      });

      // ب) تجهيز وتكريت روابط الصور لو موجودة
      if (uploadedImageUrls.length > 0) {
        const imageRecords = uploadedImageUrls.map((url, index) => ({
          image_url: url,
          sort_order: index,
          productId: product.id,
        }));

        await tx.productImage.createMany({ data: imageRecords });
      }

      // ج) رجع المنتج كامل بالصور بتاعته من جوة الـ transaction
      return tx.product.findUnique({
        where: { id: product.id },
        include: { images: { orderBy: { sort_order: "asc" } } },
      });
    });

    return result;

  } catch (error) {

    console.error(" فشلت العملية، جاري التراجع وحذف الصور المعلقة:", error.message);
    
    if (uploadedImageUrls.length > 0) {
      await Promise.all(uploadedImageUrls.map((url) => deleteFile(url).catch(() => null)));
    }

    throw new Error(error.message || "فشلت عملية إنشاء المنتج بالكامل");
  }
};

const getMyProducts = async (storeId) => {
  return prisma.product.findMany({
    where: { storeId },
    include: { images: { orderBy: { sort_order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateProduct = async ({ productId, storeId, body }) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
  });
  if (!product) throw new Error("المنتج مش موجود");

  return prisma.product.update({
    where: { id: productId },
    data: {
      name: body.name,
      price: body.price ? parseFloat(body.price) : undefined,
      sale_price: body.sale_price ? parseFloat(body.sale_price) : undefined,
      description: body.description,
      stock: body.stock ? parseInt(body.stock) : undefined,
      is_available: body.is_available !== undefined ? body.is_available : undefined,
    },
    include: { images: { orderBy: { sort_order: "asc" } } },
  });
};

const deleteProduct = async ({ productId, storeId }) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
    include: { images: true },
  });
  if (!product) throw new Error("المنتج مش موجود");

  const activeOrdersCount = await prisma.orderItem.count({
    where: {
      productId: productId,
      order: {
        status: {
          notIn: ["DELIVERED", "CANCELLED"],
        },
      },
    },
  });
  
  if (activeOrdersCount > 0) {
    throw new Error("لا يمكن حذف المنتج، يوجد أوردرات نشطة معلقة عليه حالياً"); // ضبطت الجملة "لا يمكن"
  }

  // 2. الخطوة السحرية الناقصة: امسح الروابط القديمة من جدول الـ OrderItem الأول
  await prisma.orderItem.deleteMany({
    where: { productId: productId }
  });

  // 3. امسح الصور من Supabase
  if (product.images && product.images.length > 0) {
    await Promise.all(product.images.map((img) => deleteFile(img.image_url)));
  }

  // 4. امسح المنتج نفسه نهائياً من جدول الـ Product
  await prisma.product.delete({ where: { id: productId } });
  
  return { message: "اتمسح" };
};

// Customer
const getStoreProducts = async (slug) => {
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logo_url: true,
      whatsapp_number: true,
      products: {
        where: { is_available: true },
        include: { images: { orderBy: { sort_order: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!store) throw new Error("المتجر مش موجود");
  return store;
};

const getProductById = async ({ slug, productId }) => {
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) throw new Error("المتجر مش موجود");

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id, is_available: true },
    include: { images: { orderBy: { sort_order: "asc" } } },
  });
  if (!product) throw new Error("المنتج مش موجود");
  return product;
};

module.exports = {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getStoreProducts,
  getProductById,
};