-- database/schema.sql
CREATE DATABASE IF NOT EXISTS planner;
USE planner;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  shift_date DATE,
  start_time TIME,
  end_time TIME,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample user
INSERT INTO users (name) VALUES ('Alex');
