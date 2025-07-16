document.addEventListener("DOMContentLoaded", () => {
  fetchShifts();
  fetchLeaves();
  initDarkMode();
  loadEmployees();
});

function fetchShifts() {
  fetch("http://localhost:3000/api/shifts")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("shiftTable");
      table.innerHTML = "<tr><th>Name</th><th>Date</th><th>Shift</th></tr>";
data.forEach(row => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${row.employee_name}</td>
    <td>${row.shift_date}</td>
    <td>${row.shift_time}</td>`;
  table.appendChild(tr);
});

      
    });

}

function fetchLeaves() {
  fetch("http://localhost:3000/api/leaves")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("leaveTable");
      table.innerHTML = "<tr><th>Name</th><th>From</th><th>To</th><th>Status</th></tr>";
      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.employee_name}</td>
          <td>${row.start_date}</td>
          <td>${row.end_date}</td>
          <td>${row.status}</td>`;
        table.appendChild(tr);
      });
    });
}

function applyLeave() {
  const name = document.getElementById("name").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const reason = document.getElementById("reason").value.trim();

  if (!name || !startDate || !endDate) {
    document.getElementById("leaveError").innerText = "All fields except reason are required.";
    return;
  }

  fetch("http://localhost:3000/api/apply-leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, start_date: startDate, end_date: endDate, reason })
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById("leaveError").innerText = "";
    document.getElementById("name").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("reason").value = "";
    fetchLeaves();
  })
  .catch(() => {
    document.getElementById("leaveError").innerText = "Failed to submit leave request.";
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
    document.getElementById("shiftError").innerText = "All fields are required.";
    return;
  }

  fetch("http://localhost:3000/api/add-shift", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_name, shift_date, shift_time })
  })
  .then(res => res.json())
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

async function loadEmployees() {
  const nameSelect = document.getElementById('employeesdata');
  try {
    const res = await fetch('http://localhost:3000/api/employees');
    const employees = await res.json();
    nameSelect.innerHTML = '<option value="">Select Employee</option>';
    employees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = emp.username; // Display username in dropdown
      nameSelect.appendChild(opt);
    });
  } catch (e) {
    nameSelect.innerHTML = '<option value="">Failed to load employees</option>';
  }
}

