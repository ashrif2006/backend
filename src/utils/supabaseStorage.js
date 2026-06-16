const supabase = require("../services/supabase");
const path = require("path");

const BUCKET = "images";

const uploadFile = async (file, folder) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const fileName = `${folder}/${Date.now()}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
};

const deleteFile = async (fileUrl) => {
  const filePath = fileUrl.split(`/storage/v1/object/public/${BUCKET}/`)[1];
  if (filePath) {
    await supabase.storage.from(BUCKET).remove([filePath]);
  }
};

module.exports = { uploadFile, deleteFile };