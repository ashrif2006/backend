const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { createOrder, getStoreOrders, updateOrderStatus } = require("../controllers/order.controller");

// Customer
router.post("/store/:slug/orders", createOrder);

// Owner
router.get("/dashboard/orders", authenticate, getStoreOrders);
router.put("/orders/:id/status", authenticate, updateOrderStatus);

module.exports = router;