// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_me_secret_key";

// Middleware
app.use(cors());
app.use(express.json());

// --- SQLite3 Setup (Promise wrappers) ---
const db = new sqlite3.Database("./db.sqlite");

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // has lastID, changes
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function initDb() {
  // Users table (admins)
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    );
  `);

  // Employees table
  await exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      salary REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Default admin
  const admin = await get("SELECT * FROM users WHERE username = ?", ["admin"]);
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await run(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      ["admin", hashed, "admin"]
    );
    console.log("Default admin created -> username: admin, password: admin123");
  } else {
    console.log("Admin already exists");
  }
}

// --- Auth Middleware ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Invalid token format" });

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
}

// --- Routes ---

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Employee CRUD API running ✅" });
});

// Auth: Login
app.post(
  "/api/auth/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;

    try {
      const user = await get("SELECT * FROM users WHERE username = ?", [
        username,
      ]);

      if (!user)
        return res
          .status(400)
          .json({ message: "Invalid username or password" });

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Invalid username or password" });

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// --- Employee CRUD (Protected) ---

// Create Employee
app.post(
  "/api/employees",
  authMiddleware,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("position").trim().notEmpty().withMessage("Position is required"),
    body("department").trim().notEmpty().withMessage("Department is required"),
    body("salary").isFloat({ gt: 0 }).withMessage("Salary must be > 0"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, position, department, salary } = req.body;

    try {
      const existing = await get(
        "SELECT id FROM employees WHERE email = ?",
        [email]
      );
      if (existing) {
        return res
          .status(400)
          .json({ message: "Employee with this email already exists" });
      }

      const result = await run(
        `
        INSERT INTO employees (name, email, position, department, salary)
        VALUES (?, ?, ?, ?, ?)
      `,
        [name, email, position, department, salary]
      );

      const newEmployee = await get(
        "SELECT * FROM employees WHERE id = ?",
        [result.lastID]
      );
      res.status(201).json(newEmployee);
    } catch (err) {
      console.error("Create employee error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Read All Employees
app.get("/api/employees", authMiddleware, async (req, res) => {
  try {
    const employees = await all(
      "SELECT * FROM employees ORDER BY created_at DESC"
    );
    res.json(employees);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Read Single Employee
app.get("/api/employees/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await get("SELECT * FROM employees WHERE id = ?", [id]);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employee);
  } catch (err) {
    console.error("Get employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Employee
app.put(
  "/api/employees/:id",
  authMiddleware,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("position").trim().notEmpty().withMessage("Position is required"),
    body("department").trim().notEmpty().withMessage("Department is required"),
    body("salary").isFloat({ gt: 0 }).withMessage("Salary must be > 0"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name, email, position, department, salary } = req.body;

    try {
      const employee = await get("SELECT * FROM employees WHERE id = ?", [id]);
      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      const existing = await get(
        "SELECT id FROM employees WHERE email = ? AND id <> ?",
        [email, id]
      );
      if (existing) {
        return res.status(400).json({
          message: "Another employee with this email already exists",
        });
      }

      await run(
        `
        UPDATE employees
        SET name = ?, email = ?, position = ?, department = ?, salary = ?
        WHERE id = ?
      `,
        [name, email, position, department, salary, id]
      );

      const updated = await get("SELECT * FROM employees WHERE id = ?", [id]);
      res.json(updated);
    } catch (err) {
      console.error("Update employee error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete Employee
app.delete("/api/employees/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await get("SELECT * FROM employees WHERE id = ?", [id]);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    await run("DELETE FROM employees WHERE id = ?", [id]);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Start Server ---
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
