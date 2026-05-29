const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db      = require("../models/db");
const authMw  = require("../middleware/auth");

const sign = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
router.post("/register", [
  body("name").trim().notEmpty().withMessage("Naam zaroori hai"),
  body("email").isEmail().withMessage("Valid email do"),
  body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  body("role").isIn(["technician", "client"]).withMessage("Role galat hai"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { name, email, password, role } = req.body;
  try {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length) return res.status(400).json({ message: "Email already registered hai" });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );

    const user = { id: result.insertId, name, email, role };
    res.status(201).json({ token: sign(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", [
  body("email").isEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Email ya password galat hai" });

  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(400).json({ message: "Email ya password galat hai" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Email ya password galat hai" });

    const { password: _, ...safeUser } = user;
    res.json({ token: sign(safeUser), user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", authMw, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User nahi mila" });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
