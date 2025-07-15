const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // your MySQL password if any
  database: "planner"
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// Get all shifts
app.get("/api/shifts", (req, res) => {
  db.query("SELECT * FROM shifts", (err, results) => {
    if (err) return res.status(500).send("Error fetching shifts");
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

