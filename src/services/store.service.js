const prisma = require("./prisma");
const { uploadFile, deleteFile } = require("../utils/supabaseStorage");

const uploadLogo = async ({ storeId, file }) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { logo_url: true },
  });
  if (!store) throw new Error("Store not found");

  // امسح القديم
  if (store.logo_url) await deleteFile(store.logo_url);

  const logo_url = await uploadFile(file, `logos/${storeId}`);

  return prisma.store.update({
    where: { id: storeId },
    data: { logo_url },
    select: { id: true, name: true, slug: true, logo_url: true },
  });
};

const removeLogo = async (storeId) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { logo_url: true },
  });
  if (!store) throw new Error("Store not found");
  if (!store.logo_url) throw new Error("Store has no logo to remove");

  await deleteFile(store.logo_url);

  await prisma.store.update({
    where: { id: storeId },
    data: { logo_url: null },
  });
};

const getStoreProfile = async (storeId) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Store not found");
  return store;
};

const updateStore = async ({ storeId, name, slug, whatsapp_number }) => {
  if (slug) {
    const existing = await prisma.store.findFirst({
      where: { slug, NOT: { id: storeId } },
    });
    if (existing) throw new Error("This slug is already taken");
  }

  return prisma.store.update({
    where: { id: storeId },
    data: { name, slug, whatsapp_number },
  });
};

const getPublicStore = async (slug) => {
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
      },
    },
  });
  if (!store) throw new Error("Store not found");
  return store;
};

module.exports = { uploadLogo, removeLogo, getStoreProfile, updateStore, getPublicStore };