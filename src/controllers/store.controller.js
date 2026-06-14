const prisma = require("../services/prisma");
const supabase = require("../services/supabase");
const path = require("path");

const BUCKET = "images";
const LOGOS_FOLDER = "logos";

// Upload / replace store logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { storeId } = req.user; // from auth middleware

    // Fetch current store to check for an existing logo
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { logo_url: true },
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Delete the old logo from Supabase if it exists
    if (store.logo_url) {
      // Extract the storage path from the full URL
      // URL looks like: https://<ref>.supabase.co/storage/v1/object/public/images/logos/<filename>
      const oldPath = store.logo_url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
      if (oldPath) {
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }
    }

    // Build a unique filename: logos/<storeId>-<timestamp>.ext
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${LOGOS_FOLDER}/${storeId}-${Date.now()}${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ message: "Failed to upload image", error: uploadError.message });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    const logo_url = urlData.publicUrl;

    // Update the store record
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { logo_url },
      select: { id: true, name: true, slug: true, logo_url: true },
    });

    res.json({ message: "Logo uploaded successfully", store: updatedStore });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Remove store logo
const removeLogo = async (req, res) => {
  try {
    const { storeId } = req.user;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { logo_url: true },
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    if (!store.logo_url) {
      return res.status(400).json({ message: "Store has no logo to remove" });
    }

    // Delete from Supabase Storage
    const filePath = store.logo_url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
    if (filePath) {
      await supabase.storage.from(BUCKET).remove([filePath]);
    }

    // Clear the logo_url in the database
    await prisma.store.update({
      where: { id: storeId },
      data: { logo_url: null },
    });

    res.json({ message: "Logo removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { uploadLogo, removeLogo };
