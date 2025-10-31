const express = require("express");
const router = express.Router();
const {
  addProduct,
  searchProduct,
  getAllProducts,
} = require("../controllers/productController");

router.post("/add", addProduct);
router.get("/search/:keyword", searchProduct);
router.get("/", getAllProducts);

module.exports = router;
