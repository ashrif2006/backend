const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const { uploadLogo, removeLogo } = require("../controllers/store.controller");

// POST /api/store/logo — upload or replace the store logo (single image)
router.post("/logo", authenticate, upload.single("logo"), (req, res, next) => {
  // Handle multer errors (wrong file type, file too large, etc.)
  next();
}, uploadLogo);

// DELETE /api/store/logo — remove the store logo
router.delete("/logo", authenticate, removeLogo);

module.exports = router;
