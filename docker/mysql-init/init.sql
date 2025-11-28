-- ============================================
--  Crear base de datos
-- ============================================
CREATE DATABASE IF NOT EXISTS finditunal_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finditunal_db;

-- Opcional: limpiar tablas anteriores
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS adminactions;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
--  Tabla users (user_id = letras + números)
-- ============================================
CREATE TABLE users (
  user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  google_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NULL,
  is_confirmed TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_id (google_id),
  KEY idx_users_role (role),
  CHECK (user_id REGEXP '^[A-Za-z]+[0-9]+$')
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla categories
-- ============================================
CREATE TABLE categories (
  category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla locations
-- ============================================
CREATE TABLE locations (
  location_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (location_id),
  UNIQUE KEY uq_locations_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla reports
-- ============================================
CREATE TABLE reports (
  report_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  location_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('perdido','encontrado','entregado')
         NOT NULL DEFAULT 'perdido',
  date_lost_or_found DATE NULL,
  contact_method VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  KEY idx_reports_user_id (user_id),
  KEY idx_reports_category_id (category_id),
  KEY idx_reports_location_id (location_id),
  KEY idx_reports_status (status),
  CONSTRAINT fk_reports_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_reports_category
    FOREIGN KEY (category_id)
    REFERENCES categories (category_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_reports_location
    FOREIGN KEY (location_id)
    REFERENCES locations (location_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla images
-- ============================================
CREATE TABLE images (
  image_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  PRIMARY KEY (image_id),
  KEY idx_images_report_id (report_id),
  CONSTRAINT fk_images_report
    FOREIGN KEY (report_id)
    REFERENCES reports (report_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla conversations
-- ============================================
CREATE TABLE conversations (
  conversation_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id INT UNSIGNED NOT NULL,
  user1_id VARCHAR(255) NOT NULL,
  user2_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id),
  KEY idx_conversations_report_id (report_id),
  KEY idx_conversations_user1_id (user1_id),
  KEY idx_conversations_user2_id (user2_id),
  UNIQUE KEY uq_conversations_report_users (report_id, user1_id, user2_id),
  CONSTRAINT fk_conversations_report
    FOREIGN KEY (report_id)
    REFERENCES reports (report_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_conversations_user1
    FOREIGN KEY (user1_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_conversations_user2
    FOREIGN KEY (user2_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla messages
-- ============================================
CREATE TABLE messages (
  message_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  message_text TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id),
  KEY idx_messages_conversation_id (conversation_id),
  KEY idx_messages_sender_id (sender_id),
  KEY idx_messages_conversation_created (conversation_id, created_at),
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversations (conversation_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla notifications
-- ============================================
CREATE TABLE notifications (
  notification_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  type ENUM('system','report','complaint','message') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_id INT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  KEY idx_notifications_user_id (user_id),
  KEY idx_notifications_is_read (is_read),
  KEY idx_notifications_type (type),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla complaints
-- ============================================
CREATE TABLE complaints (
  complaint_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id INT UNSIGNED NOT NULL,
  reporter_user_id VARCHAR(255) NOT NULL,
  reason ENUM('spam','inappropriate','fraud','other') NOT NULL,
  description TEXT,
  status ENUM('pending','in_review','resolved','rejected')
         NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by VARCHAR(255) NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id),
  KEY idx_complaints_report_id (report_id),
  KEY idx_complaints_reporter_user_id (reporter_user_id),
  KEY idx_complaints_status (status),
  KEY idx_complaints_resolved_by (resolved_by),
  CONSTRAINT fk_complaints_report
    FOREIGN KEY (report_id)
    REFERENCES reports (report_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_complaints_reporter
    FOREIGN KEY (reporter_user_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_complaints_resolved_by
    FOREIGN KEY (resolved_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================
--  Tabla adminactions
-- ============================================
CREATE TABLE adminactions (
  action_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id VARCHAR(255) NOT NULL,
  action_type ENUM('suspend_user','unsuspend_user','delete_report',
                   'resolve_complaint','other') NOT NULL,
  target_type ENUM('user','report','complaint','other') NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (action_id),
  KEY idx_adminactions_admin_id (admin_id),
  KEY idx_adminactions_target (target_type, target_id),
  CONSTRAINT fk_adminactions_admin
    FOREIGN KEY (admin_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
