require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/auth"));

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", message: "Server chal raha hai ✅" }));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
