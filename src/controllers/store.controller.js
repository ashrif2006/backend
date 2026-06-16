const storeService = require("../services/store.service");

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    const store = await storeService.uploadLogo({
      storeId: req.user.storeId,
      file: req.file,
    });
    res.json({ message: "Logo uploaded successfully", store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeLogo = async (req, res) => {
  try {
    await storeService.removeLogo(req.user.storeId);
    res.json({ message: "Logo removed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStoreProfile = async (req, res) => {
  try {
    const store = await storeService.getStoreProfile(req.user.storeId);
    res.json({ store });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateStore = async (req, res) => {
  try {
    const store = await storeService.updateStore({
      storeId: req.user.storeId,
      ...req.body,
    });
    res.json({ message: "Store updated successfully", store });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPublicStore = async (req, res) => {
  try {
    const store = await storeService.getPublicStore(req.params.slug);
    res.json({ success: true, store });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = { uploadLogo, removeLogo, getStoreProfile, updateStore, getPublicStore };