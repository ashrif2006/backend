const productService = require("../services/product.service");

const createProduct = async (req, res) => {
  try {
    const result = await productService.createProduct({
      storeId: req.user.storeId,
      body: req.body,
      files: req.files,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const result = await productService.getMyProducts(req.user.storeId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const result = await productService.updateProduct({
      productId: req.params.id,
      storeId: req.user.storeId,
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct({
      productId: req.params.id,
      storeId: req.user.storeId,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStoreProducts = async (req, res) => {
  try {
    const result = await productService.getStoreProducts(req.params.slug);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const result = await productService.getProductById({
      slug: req.params.slug,
      productId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = { createProduct, getMyProducts, updateProduct, deleteProduct, getStoreProducts, getProductById };