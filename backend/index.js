const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const app = express();

app.use(bodyParser.json());

mongoose.connect("mongodb://localhost/ecommerce_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require("./models/user");
const Product = require("./models/product");
const Cart = require("./models/cart");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false);
      const isMatch = await user.comparePassword(password);
      if (isMatch) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.post("/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ... Previous code ...

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false);
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error);
    }
  })
);

// Implement login route using passport-local
app.post("/login", passport.authenticate("local"), (req, res) => {
  // Authentication successful, send a success response or redirect
  res.json({ message: "Login successful", user: req.user });
});

app.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Implement routes for fetching, updating, and deleting products

// Fetch all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch a specific product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a product by ID
app.put("/products/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a product by ID
app.delete("/products/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndRemove(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/cart", async (req, res) => {
  try {
    const cart = await Cart.create(req.body);
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Implementing routes for managing the shopping cart
app.post("/cart", async (req, res) => {
  try {
    const { userId, items } = req.body;
    const cart = await Cart.create({ userId, items });
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/cart/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/cart/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { items } = req.body;
    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { new: true }
    );
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/cart/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    await Cart.deleteOne({ userId });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
