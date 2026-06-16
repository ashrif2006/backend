const express = require("express");
const multer = require("multer");
const app = express();

app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/store", require("./routes/store.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/store.routes"));
app.use("/api", require("./routes/product.routes"));
app.use("/api", require("./routes/order.routes"));

// Global error handler — catches multer & other errors
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size must be under 2 MB" });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
});


module.exports = app;