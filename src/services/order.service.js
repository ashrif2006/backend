const prisma = require("./prisma");

const createOrder = async ({ slug, body }) => {
  const { customer_name, customer_phone, customer_address, notes, items } =
    body;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) throw new Error("المتجر مش موجود");

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: store.id, is_available: true },
  });

  if (products.length !== items.length)
    throw new Error("في منتج مش موجود أو مش متاح");

  let totalPrice = 0;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} مش متاح بالكمية دي`);
    }
    totalPrice += product.price * item.quantity;
    const commissionRate = Number(store.commission_rate) || 0.1;
    return {
      product: { connect: { id: item.productId } }, 
      quantity: item.quantity,
      price_at_purchase: product.price,
      seller_amount: product.price * item.quantity * (1 - commissionRate),
    };
  });

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      customer_name,
      customer_phone,
      customer_address,
      notes,
      totalPrice,
      items: { create: orderItems },
    },
    include: {
      items: { include: { product: { include: { images: true } } } },
    },
  });

  // WhatsApp URL
  let whatsapp_url = null;
  if (store.whatsapp_number) {
    const msg = `مرحباً ${customer_name}! ✅\nتم استلام طلبك من ${store.name}\nرقم الطلب: #${order.id.slice(0, 8)}\nالإجمالي: ${totalPrice} جنيه\nالدفع: كاش عند الاستلام 💵`;
    whatsapp_url = `https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(msg)}`;
    await prisma.order.update({
      where: { id: order.id },
      data: { whatsapp_sent: true },
    });
  }

  return { ...order, whatsapp_url };
};

const getStoreOrders = async ({ storeId, status }) => {
  return prisma.order.findMany({
    where: { storeId, ...(status && { status }) },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateOrderStatus = async ({ orderId, storeId, status }) => {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status)) throw new Error("status غلط");

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
  });
  if (!order) throw new Error("الأوردر مش موجود");

  return prisma.order.update({ where: { id: orderId }, data: { status } });
};

module.exports = { createOrder, getStoreOrders, updateOrderStatus };
