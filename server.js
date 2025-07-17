const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const port = 3000;

const JWT_SECRET = "24880fc78ab28a8d0c25c98079c446afbe15441f43823bb17bc9041a25671202836d9e6ff4c85e9ceaf8230bc5f07386e23071c691ded5cd8bba899af9e2df67";
app.use(cors());
app.use(express.json());

// Serve login.html as default page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Serve static files (must come AFTER the "/" route above)
app.use(express.static(path.join(__dirname)));


// Connect to MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Terer.0308$",
  database: "planner"
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// Login API (returns JWT token)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.status(401).send("Invalid credentials");
    const user = { id: results[0].id, email: results[0].email, is_admin: results[0].is_admin };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login successful", token, user });
  });
});

// Middleware to protect routes using Bearer token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid token");
    req.user = user;
    next();
  });
}

// Protect main.html
app.get("/main.html", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "main.html"));
});

// Get all shifts
app.get("/api/shifts", (req, res) => {
  db.query("SELECT * FROM shifts", (err, results) => {
    if (err) return res.status(500).send("Error fetching shifts");
    res.json(results);
  });
});


// get all employees
app.get("/api/employees", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send("Error fetching employees");
    console.log("Fetched employees:", results); // Debugging line
    res.json(results);
  });
});

// Get all leave requests
app.get("/api/leaves", (req, res) => {
  db.query("SELECT * FROM leave_requests", (err, results) => {
    if (err) return res.status(500).send("Error fetching leaves");
    res.json(results);
  });
});

// Apply for leave
app.post("/api/apply-leave", (req, res) => {
  const { name, start_date, end_date, reason } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).send("Missing required fields");
  }

  const sql = `
    INSERT INTO leave_requests (employee_name, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `;
  db.query(sql, [name, start_date, end_date, reason || ''], (err) => {
    if (err) return res.status(500).send("Failed to submit leave");
    res.json({ message: "Leave request submitted!" });
  });
});

// Update leave request (approve/reject)
app.post("/api/update-leave-status", (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).send("Missing fields");

  const sql = `UPDATE leave_requests SET status = ? WHERE id = ?`;
  db.query(sql, [status, id], (err) => {
    if (err) return res.status(500).send("Update failed");
    res.json({ message: "Leave status updated" });
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
app.post("/api/add-shift", (req, res) => {
  const { employee_name, shift_date, shift_time } = req.body;
  if (!employee_name || !shift_date || !shift_time) {
    return res.status(400).send("All fields are required");
  }

  const sql = "INSERT INTO shifts (employee_name, shift_date, shift_time) VALUES (?, ?, ?)";
  db.query(sql, [employee_name, shift_date, shift_time], (err) => {
    if (err) {
      console.error("Shift insert error:", err); // 👈 Add this
      return res.status(500).send("Failed to add shift");
    }
    res.json({ message: "Shift added!" });
  });
});

