// server.js

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// File for storing orders
const ORDERS_FILE = path.join(__dirname, "orders.json");

// Utility: Ensure file exists
function ensureFile(filePath, defaultContent = "[]") {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, "utf8");
  }
}

// Read orders
function readOrders() {
  ensureFile(ORDERS_FILE);
  const raw = fs.readFileSync(ORDERS_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("JSON parse error in orders file:", err);
    return [];
  }
}

// Write orders
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

// Generate order ID
function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000);
  return `ORD${ts}${rand}`;
}

// === Routes ===

// Place a new order
app.post("/api/placeOrder", (req, res) => {
  const { customer, items, total, paymentMethod } = req.body;

  if (!customer || !items || total == null || !paymentMethod) {
    return res.status(400).json({ success: false, error: "Missing order data" });
  }

  const orders = readOrders();
  const orderId = generateOrderId();
  const timestamp = new Date().toISOString();

  const newOrder = {
    orderId,
    customer,
    items,
    total,
    paymentMethod,
    timestamp
  };

  orders.push(newOrder);
  writeOrders(orders);

  res.json({ success: true, orderId });
});

// Get all orders (for admin)
app.get("/api/orders", (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// Get a specific order by ID (for admin detail)
app.get("/api/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const orders = readOrders();
  const found = orders.find(o => String(o.orderId) === String(orderId));
  if (!found) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(found);
});

// Fallback – serve frontend for any other route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "customer-dashboard.html"));
});

// Start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
