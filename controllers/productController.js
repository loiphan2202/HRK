const Product = require("../models/productModel");

// Thêm sản phẩm
exports.addProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json({
      message: "✅ Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tìm sản phẩm
exports.searchProduct = async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const products = await Product.find({
      name: { $regex: keyword, $options: "i" },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả sản phẩm (optional)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
