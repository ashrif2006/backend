const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const upload = require("../services/upload");
const {
  createProduct, getMyProducts, updateProduct,
  deleteProduct, getStoreProducts, getProductById,
} = require("../controllers/product.controller");

// Customer
router.get("/store/:slug/products", getStoreProducts);
router.get("/store/:slug/products/:id", getProductById);

// Owner
router.get("/products", authenticate, getMyProducts);
router.post("/products", authenticate, upload.array("images", 3), createProduct);
router.put("/products/:id", authenticate, updateProduct);
router.delete("/products/:id", authenticate, deleteProduct);

module.exports = router;