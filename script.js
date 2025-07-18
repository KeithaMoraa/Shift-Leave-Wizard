document.addEventListener("DOMContentLoaded", () => {
  fetchShifts();
  fetchLeaves();
  initDarkMode();
  loadEmployeeNames();
});
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Check authentication on page load
if (window.location.pathname.endsWith("main.html")) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
  }
}

// Login function
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorElem = document.getElementById("loginError");
  errorElem.textContent = "";

  fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
        // Check is_admin and redirect
        if (data.user && data.user.is_admin === 1) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "main.html";
        }
      } else {
        errorElem.textContent = data.message || "Invalid credentials";
      }
    })
    .catch(() => {
      errorElem.textContent = "Login failed. Try again.";
    });
}

function showUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;
  // Decode JWT payload (base64)
  const payload = JSON.parse(atob(token.split(".")[1]));
  const name = payload.name || payload.email || "User";
  const email = payload.email || "";
  const role = payload.is_admin === 1 ? "Admin" : "User";
  const profileBar = document.getElementById("userProfile");
  if (profileBar) {
    profileBar.textContent = `${name}- ${role}`;
  }
}

// Call this on page load
document.addEventListener("DOMContentLoaded", () => {
  showUserProfile();
  // ...existing code...
});

// Helper to get Authorization headers
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: "Bearer " + token } : {};
}

function fetchShifts() {
  fetch("http://localhost:3000/api/shifts", {
    headers: { ...authHeaders() },
  })
    .then((res) => res.json())
    .then((data) => {
      const table = document.getElementById("shiftTable");
      table.innerHTML = "<tr><th>Name</th><th>Date</th><th>Shift</th></tr>";
      data.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.employee_name}</td>
          <td>${formatDate(row.shift_date)}</td>
          <td>${formatDate(row.shift_time)}</td>`;
        table.appendChild(tr);
      });
      s;
    });
}

function fetchLeaves() {
  const token = localStorage.getItem("token");
  if (!token) return;
  const payload = JSON.parse(atob(token.split(".")[1]));
  const userId = payload.id;
  const isAdmin = payload.is_admin === 1;

  const table = document.getElementById("leaveTable");

  if (isAdmin) {
    // Admin: fetch all leaves
    fetch("http://localhost:3000/api/leaves", {
      headers: { ...authHeaders() },
    })
      .then((res) => res.json())
      .then((data) => {
        table.innerHTML =
          "<tr><th>Name</th><th>From</th><th>To</th><th>Status</th><th>Action</th></tr>";
        data.forEach((row) => {
          const tr = document.createElement("tr");
          const isProcessed = row.status !== "Pending";
          const approveStyle = isProcessed
            ? "background:gray;color:white;cursor:not-allowed;"
            : "background:green;color:white;";
          const rejectStyle = isProcessed
            ? "background:gray;color:white;cursor:not-allowed;"
            : "background:#dc3545;color:white;";
          tr.innerHTML = `
            <td>${row.employee_name}</td>
            <td>${formatDate(row.start_date)}</td>
            <td>${formatDate(row.end_date)}</td>
            <td>${row.status}</td>
            <td>
              <button 
                onclick="approveLeave(${row.id})" 
                style="${approveStyle}" 
                ${isProcessed ? "disabled" : ""}
              >Approve</button>
              <button 
                onclick="rejectLeave(${row.id})" 
                style="${rejectStyle}" 
                ${isProcessed ? "disabled" : ""}
              >Reject</button>
            </td>
          `;
          table.appendChild(tr);
        });
      });
  } else {
    // User: fetch only their leaves
    fetch(`http://localhost:3000/api/leaves/${userId}`, {
      headers: { ...authHeaders() },
    })
      .then((res) => res.json())
      .then((data) => {
        table.innerHTML = "<tr><th>From</th><th>To</th><th>Status</th></tr>";
        data.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${formatDate(row.start_date)}</td>
            <td>${formatDate(row.end_date)}</td>
            <td>${row.status}</td>
          `;
          table.appendChild(tr);
        });
      });
  }
}

function applyLeave() {
  const employeeId = document.getElementById("employeelist").value; // Use value as employee_id
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const reason = document.getElementById("reason").value.trim();

  if (!employeeId || !startDate || !endDate) {
    document.getElementById("leaveError").innerText =
      "All fields except reason are required.";
    return;
  }

  fetch("http://localhost:3000/api/apply-leave", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
      reason,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      document.getElementById("leaveError").innerText = "";
      document.getElementById("employeelist").value = "";
      document.getElementById("startDate").value = "";
      document.getElementById("endDate").value = "";
      document.getElementById("reason").value = "";
      fetchLeaves();
    })
    .catch(() => {
      document.getElementById("leaveError").innerText =
        "Failed to submit leave request.";
    });
}

// Dark Mode
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

function initDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
}
function addShift() {
  const employee_name = document.getElementById("shiftName").value;
  const shift_date = document.getElementById("shiftDate").value;
  const shift_time = document.getElementById("shiftTime").value;

  if (!employee_name || !shift_date || !shift_time) {
    document.getElementById("shiftError").innerText =
      "All fields are required.";
    return;
  }

  fetch("http://localhost:3000/api/add-shift", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_name, shift_date, shift_time }),
  })
    .then((res) => res.json())
    .then(() => {
      document.getElementById("shiftError").innerText = "";
      document.getElementById("shiftName").value = "";
      document.getElementById("shiftDate").value = "";
      document.getElementById("shiftTime").value = "";
      fetchShifts();
    })
    .catch(() => {
      document.getElementById("shiftError").innerText = "Failed to add shift.";
    });
}

// Fetch employee names and populate dropdown
function loadEmployeeNames() {
  fetch("http://localhost:3000/api/employees")
    .then((response) => response.json())
    .then((data) => {
      const nameSelect = document.getElementById("employeelist");
      nameSelect.innerHTML = '<option value="">Select Employee</option>';
      data.forEach((emp) => {
        const option = document.createElement("option");
        option.value = emp.id; // Use employee id
        option.textContent = emp.name;
        nameSelect.appendChild(option);
      });
    })
    .catch(() => {
      document.getElementById("leaveError").textContent =
        "Failed to load employees.";
    });
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

// Call this on page load
document.addEventListener("DOMContentLoaded", () => {
  showUserProfile();
  // ...existing code...
});

// Call on page load
window.onload = function () {
  loadEmployeeNames();
  // ...other initialization code if any...
};

function approveLeave(leaveId) {
  fetch("http://localhost:3000/api/update-leave-status", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ id: leaveId, status: "Approved" }),
  })
    .then((res) => res.json())
    .then(() => {
      fetchLeaves();
    })
    .catch(() => {
      alert("Failed to approve leave.");
    });
}

function rejectLeave(leaveId) {
  fetch("http://localhost:3000/api/update-leave-status", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ id: leaveId, status: "Rejected" }),
  })
    .then((res) => res.json())
    .then(() => {
      fetchLeaves();
    })
    .catch(() => {
      alert("Failed to reject leave.");
    });
}
