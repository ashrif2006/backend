const orderService = require("../services/order.service");

const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder({
      slug: req.params.slug,
      body: req.body,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStoreOrders = async (req, res) => {
  try {
    const result = await orderService.getStoreOrders({
      storeId: req.user.storeId,
      status: req.query.status,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const result = await orderService.updateOrderStatus({
      orderId: req.params.id,
      storeId: req.user.storeId,
      status: req.body.status,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createOrder, getStoreOrders, updateOrderStatus };