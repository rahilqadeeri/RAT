-- Remote Support Tool — Database Schema
-- Run karo: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS remote_support_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE remote_support_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('technician', 'client') NOT NULL DEFAULT 'client',
  is_active  TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table (Phase 3 ke liye ready)
CREATE TABLE IF NOT EXISTS sessions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  session_code VARCHAR(20) NOT NULL UNIQUE,
  technician_id INT NOT NULL,
  client_id    INT,
  status       ENUM('waiting','active','ended','rejected') DEFAULT 'waiting',
  started_at   TIMESTAMP NULL,
  ended_at     TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (technician_id) REFERENCES users(id),
  FOREIGN KEY (client_id)     REFERENCES users(id)
);

-- Session logs (Phase 5 ke liye)
CREATE TABLE IF NOT EXISTS session_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  event      VARCHAR(100),
  details    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Demo admin user (password: password123)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin User', 'admin@rst.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS4iqyi', 'technician');
