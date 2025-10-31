const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Routes
app.use("/api/products", require("./routes/productRoutes"));

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Product API 🚀");
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
