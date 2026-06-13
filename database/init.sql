-- ============================================================
-- 共享单车管理系统 - Database Initialization Script
-- Description: Creates all tables with indexes and constraints
-- NOTE: Idempotent — safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS shared_bike
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shared_bike;
SET NAMES utf8mb4;

-- ============================================================
-- Tables ordered so that referenced tables are created first,
-- allowing FOREIGN KEY constraints to be defined inline.
-- DROP order is the reverse, handled automatically by CASCADE.
-- ============================================================

-- ============================================================
-- 1. admins (管理员) — no FKs, referenced by many
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role ENUM('super_admin', 'operator') NOT NULL DEFAULT 'operator',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1=active, 0=disabled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username),
  INDEX idx_admins_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. users (终端用户/骑行用户) — no FKs, referenced by many
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  real_name VARCHAR(50) DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  deposit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1=normal, 0=frozen',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_phone (phone),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. operating_zones (运营区域/电子围栏) — referenced by bikes
-- ============================================================
CREATE TABLE IF NOT EXISTS operating_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50) DEFAULT NULL,
  boundary POLYGON NOT NULL COMMENT 'Geofence polygon (MySQL spatial)',
  center_lat DECIMAL(10,7) DEFAULT NULL,
  center_lng DECIMAL(10,7) DEFAULT NULL,
  radius_m INT DEFAULT NULL COMMENT 'Approximate radius in meters',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1=active, 0=inactive',
  max_bikes INT DEFAULT 500,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  SPATIAL INDEX idx_zone_boundary (boundary),
  INDEX idx_zone_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. bikes (单车) — FK → operating_zones, referenced by orders
-- ============================================================
CREATE TABLE IF NOT EXISTS bikes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bike_no VARCHAR(20) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  status ENUM('available', 'in_use', 'repairing', 'scrapped', 'deployed') NOT NULL DEFAULT 'available',
  lock_status TINYINT NOT NULL DEFAULT 0 COMMENT '0=unlocked, 1=locked',
  battery_level INT DEFAULT 100,
  total_rides INT NOT NULL DEFAULT 0,
  total_mileage DECIMAL(10,2) DEFAULT 0.00,
  last_maintenance_at DATETIME DEFAULT NULL,
  deployed_at DATETIME DEFAULT NULL,
  zone_id INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bike_no (bike_no),
  INDEX idx_bikes_status (status),
  INDEX idx_bikes_zone (zone_id),
  INDEX idx_bikes_location (latitude, longitude),
  CONSTRAINT fk_bikes_zone FOREIGN KEY (zone_id) REFERENCES operating_zones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ride_orders (骑行订单) — FK → users, bikes
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL,
  user_id INT NOT NULL,
  bike_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME DEFAULT NULL,
  start_lat DECIMAL(10,7) NOT NULL,
  start_lng DECIMAL(10,7) NOT NULL,
  end_lat DECIMAL(10,7) DEFAULT NULL,
  end_lng DECIMAL(10,7) DEFAULT NULL,
  duration_seconds INT DEFAULT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 1.50 COMMENT 'Fixed fee: 1.5 yuan per ride',
  status ENUM('active', 'completed', 'cancelled', 'abnormal') NOT NULL DEFAULT 'active',
  payment_status TINYINT NOT NULL DEFAULT 0 COMMENT '0=unpaid, 1=paid',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order_no (order_no),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_bike (bike_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_time (start_time),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_bike FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. work_orders (运维工单) — FK → bikes, admins
-- ============================================================
CREATE TABLE IF NOT EXISTS work_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL,
  bike_id INT DEFAULT NULL,
  reporter_id INT DEFAULT NULL COMMENT 'Admin who created (NULL if auto-generated)',
  fault_type VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  severity ENUM('minor', 'major', 'critical') NOT NULL DEFAULT 'minor',
  assignee_id INT DEFAULT NULL COMMENT 'Repair person (admin)',
  status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  images JSON DEFAULT NULL COMMENT 'Array of image URLs',
  completed_at DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_wo_no (order_no),
  INDEX idx_wo_bike (bike_id),
  INDEX idx_wo_status (status),
  INDEX idx_wo_assignee (assignee_id),
  CONSTRAINT fk_wo_bike FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_wo_reporter FOREIGN KEY (reporter_id) REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT fk_wo_assignee FOREIGN KEY (assignee_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. user_reports (用户举报) — FK → users, bikes, ride_orders, admins
-- ============================================================
CREATE TABLE IF NOT EXISTS user_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bike_id INT DEFAULT NULL,
  order_id INT DEFAULT NULL,
  report_type ENUM('fault', 'violation', 'suggestion', 'other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  images JSON DEFAULT NULL COMMENT 'Array of image URLs',
  status ENUM('pending', 'reviewing', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewer_id INT DEFAULT NULL COMMENT 'Admin who reviewed',
  review_comment TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reports_user (user_id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_type (report_type),
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_reports_bike FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_order FOREIGN KEY (order_id) REFERENCES ride_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewer_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. notifications (系统通知) — FK → admins, users
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL COMMENT 'Admin who sent',
  target_user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'system' COMMENT 'system/order/promotion/alert',
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (target_user_id),
  INDEX idx_notif_read (is_read),
  CONSTRAINT fk_notif_sender FOREIGN KEY (sender_id) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notif_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. bike_location_log (单车位置日志) — FK → bikes
-- ============================================================
CREATE TABLE IF NOT EXISTS bike_location_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bike_id INT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  recorded_at DATETIME NOT NULL,
  INDEX idx_loclog_bike_time (bike_id, recorded_at),
  CONSTRAINT fk_loclog_bike FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
