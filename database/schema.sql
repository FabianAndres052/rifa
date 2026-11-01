-- =============================================================================
-- BASE DE DATOS: PLATAFORMA DE ADMINISTRACIÓN Y CONTROL DE RIFAS EN TIEMPO REAL
-- PROYECTO: Gran Rifa Navideña - Sorteo Moto Eléctrica GW E-MAX 800W
-- Sorteos: 30 Noviembre, 4 Diciembre, 18 Diciembre y 23 Diciembre (Sinuano Noche)
-- Total Números: 100 (del 00 al 99) | Valor por número: $40.000 COP
-- Compatibilidad: MySQL 8.0+, MySQL Workbench, PlanetScale, Railway, TiDB, Vercel
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `rifa_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `rifa_db`;

-- Desactivar temporalmente verificación de claves foráneas para recreación segura
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `number_assignments`;
DROP TABLE IF EXISTS `raffle_numbers`;
DROP TABLE IF EXISTS `raffle_draws`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `administrators`;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. TABLA: administrators (Usuarios administradores del sistema)
-- -----------------------------------------------------------------------------
CREATE TABLE `administrators` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: customers (Información de los compradores / clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE `customers` (
  `id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customers_phone` (`phone`),
  INDEX `idx_customers_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: raffle_numbers (Catálogo de los 100 números del 00 al 99)
-- -----------------------------------------------------------------------------
CREATE TABLE `raffle_numbers` (
  `number` VARCHAR(2) NOT NULL,
  `status` ENUM('AVAILABLE', 'RESERVED', 'SOLD_PAID', 'SOLD_PENDING') NOT NULL DEFAULT 'AVAILABLE',
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 40000.00,
  `customer_id` VARCHAR(64) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`number`),
  INDEX `idx_raffle_numbers_status` (`status`),
  INDEX `idx_raffle_numbers_customer` (`customer_id`),
  CONSTRAINT `fk_raffle_customer` 
    FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: number_assignments (Asignación transaccional cliente <-> número)
-- Restricción UNIQUE en `number` para evitar ventas duplicadas concurrentes
-- -----------------------------------------------------------------------------
CREATE TABLE `number_assignments` (
  `id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `number` VARCHAR(2) NOT NULL,
  `status` ENUM('RESERVED', 'PAID', 'PENDING') NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_number_assignment` (`number`),
  INDEX `idx_assignments_customer` (`customer_id`),
  CONSTRAINT `fk_assignment_customer` 
    FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_assignment_number` 
    FOREIGN KEY (`number`) 
    REFERENCES `raffle_numbers` (`number`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: payments (Historial de pagos y abonos realizados)
-- -----------------------------------------------------------------------------
CREATE TABLE `payments` (
  `id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_type` ENUM('TOTAL', 'ABONO') NOT NULL DEFAULT 'TOTAL',
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `reference` VARCHAR(100) NULL,
  `paid_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_payments_customer` (`customer_id`),
  INDEX `idx_payments_paid_at` (`paid_at`),
  CONSTRAINT `fk_payments_customer` 
    FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: raffle_draws (Información de los 4 sorteos oficiales)
-- -----------------------------------------------------------------------------
CREATE TABLE `raffle_draws` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `prize` VARCHAR(255) NOT NULL,
  `draw_date` DATETIME NOT NULL,
  `lottery` VARCHAR(100) NOT NULL DEFAULT 'Sinuano Noche',
  `is_main` TINYINT(1) NOT NULL DEFAULT 0,
  `winning_number` VARCHAR(2) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: audit_logs (Trazabilidad y auditoría de cambios en la plataforma)
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(100) NULL,
  `performed_by` VARCHAR(100) NOT NULL DEFAULT 'admin',
  `details` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INSERCIÓN DE DATOS INICIALES (SEEDS)
-- =============================================================================

-- Administrador por defecto (Contraseña: admin1234 con hash bcrypt $2b$10$wE..)
INSERT INTO `administrators` (`id`, `username`, `password_hash`, `full_name`, `role`)
VALUES (
  'adm-00000000-0000-0000-0000-000000000001',
  'admin',
  '$2b$10$YkR6vEkV2P.skRtCBUQyR.TXSqM6/BXncAqIbHUuELhDL5GHaCnqi',
  'Administrador Principal',
  'SUPERADMIN'
);

-- Los 4 sorteos oficiales estipulados
INSERT INTO `raffle_draws` (`id`, `title`, `prize`, `draw_date`, `lottery`, `is_main`) VALUES
('draw-1', '1° Sorteo Anticipado', '$100.000 COP en efectivo', '2026-11-30 22:30:00', 'Lotería Sinuano Noche', 0),
('draw-2', '2° Sorteo Anticipado', '$100.000 COP en efectivo', '2026-12-04 22:30:00', 'Lotería Sinuano Noche', 0),
('draw-3', '3° Sorteo Anticipado', '$100.000 COP en efectivo', '2026-12-18 22:30:00', 'Lotería Sinuano Noche', 0),
('draw-4', 'Gran Sorteo Mayor Navideño', '¡MOTO ELÉCTRICA GW E-MAX 800W - ROJO!', '2026-12-23 22:30:00', 'Lotería Sinuano Noche', 1);

-- Poblar los 100 números del 00 al 99
INSERT INTO `raffle_numbers` (`number`, `status`, `price`) VALUES
('00', 'AVAILABLE', 40000.00), ('01', 'AVAILABLE', 40000.00), ('02', 'AVAILABLE', 40000.00), ('03', 'AVAILABLE', 40000.00), ('04', 'AVAILABLE', 40000.00),
('05', 'AVAILABLE', 40000.00), ('06', 'AVAILABLE', 40000.00), ('07', 'AVAILABLE', 40000.00), ('08', 'AVAILABLE', 40000.00), ('09', 'AVAILABLE', 40000.00),
('10', 'AVAILABLE', 40000.00), ('11', 'AVAILABLE', 40000.00), ('12', 'AVAILABLE', 40000.00), ('13', 'AVAILABLE', 40000.00), ('14', 'AVAILABLE', 40000.00),
('15', 'AVAILABLE', 40000.00), ('16', 'AVAILABLE', 40000.00), ('17', 'AVAILABLE', 40000.00), ('18', 'AVAILABLE', 40000.00), ('19', 'AVAILABLE', 40000.00),
('20', 'AVAILABLE', 40000.00), ('21', 'AVAILABLE', 40000.00), ('22', 'AVAILABLE', 40000.00), ('23', 'AVAILABLE', 40000.00), ('24', 'AVAILABLE', 40000.00),
('25', 'AVAILABLE', 40000.00), ('26', 'AVAILABLE', 40000.00), ('27', 'AVAILABLE', 40000.00), ('28', 'AVAILABLE', 40000.00), ('29', 'AVAILABLE', 40000.00),
('30', 'AVAILABLE', 40000.00), ('31', 'AVAILABLE', 40000.00), ('32', 'AVAILABLE', 40000.00), ('33', 'AVAILABLE', 40000.00), ('34', 'AVAILABLE', 40000.00),
('35', 'AVAILABLE', 40000.00), ('36', 'AVAILABLE', 40000.00), ('37', 'AVAILABLE', 40000.00), ('38', 'AVAILABLE', 40000.00), ('39', 'AVAILABLE', 40000.00),
('40', 'AVAILABLE', 40000.00), ('41', 'AVAILABLE', 40000.00), ('42', 'AVAILABLE', 40000.00), ('43', 'AVAILABLE', 40000.00), ('44', 'AVAILABLE', 40000.00),
('45', 'AVAILABLE', 40000.00), ('46', 'AVAILABLE', 40000.00), ('47', 'AVAILABLE', 40000.00), ('48', 'AVAILABLE', 40000.00), ('49', 'AVAILABLE', 40000.00),
('50', 'AVAILABLE', 40000.00), ('51', 'AVAILABLE', 40000.00), ('52', 'AVAILABLE', 40000.00), ('53', 'AVAILABLE', 40000.00), ('54', 'AVAILABLE', 40000.00),
('55', 'AVAILABLE', 40000.00), ('56', 'AVAILABLE', 40000.00), ('57', 'AVAILABLE', 40000.00), ('58', 'AVAILABLE', 40000.00), ('59', 'AVAILABLE', 40000.00),
('60', 'AVAILABLE', 40000.00), ('61', 'AVAILABLE', 40000.00), ('62', 'AVAILABLE', 40000.00), ('63', 'AVAILABLE', 40000.00), ('64', 'AVAILABLE', 40000.00),
('65', 'AVAILABLE', 40000.00), ('66', 'AVAILABLE', 40000.00), ('67', 'AVAILABLE', 40000.00), ('68', 'AVAILABLE', 40000.00), ('69', 'AVAILABLE', 40000.00),
('70', 'AVAILABLE', 40000.00), ('71', 'AVAILABLE', 40000.00), ('72', 'AVAILABLE', 40000.00), ('73', 'AVAILABLE', 40000.00), ('74', 'AVAILABLE', 40000.00),
('75', 'AVAILABLE', 40000.00), ('76', 'AVAILABLE', 40000.00), ('77', 'AVAILABLE', 40000.00), ('78', 'AVAILABLE', 40000.00), ('79', 'AVAILABLE', 40000.00),
('80', 'AVAILABLE', 40000.00), ('81', 'AVAILABLE', 40000.00), ('82', 'AVAILABLE', 40000.00), ('83', 'AVAILABLE', 40000.00), ('84', 'AVAILABLE', 40000.00),
('85', 'AVAILABLE', 40000.00), ('86', 'AVAILABLE', 40000.00), ('87', 'AVAILABLE', 40000.00), ('88', 'AVAILABLE', 40000.00), ('89', 'AVAILABLE', 40000.00),
('90', 'AVAILABLE', 40000.00), ('91', 'AVAILABLE', 40000.00), ('92', 'AVAILABLE', 40000.00), ('93', 'AVAILABLE', 40000.00), ('94', 'AVAILABLE', 40000.00),
('95', 'AVAILABLE', 40000.00), ('96', 'AVAILABLE', 40000.00), ('97', 'AVAILABLE', 40000.00), ('98', 'AVAILABLE', 40000.00), ('99', 'AVAILABLE', 40000.00);

-- Log inicial de auditoría
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`)
VALUES (
  'log-00000000-0000-0000-0000-000000000001',
  'SYSTEM_INIT',
  'database',
  'rifa_db',
  'system',
  'Inicialización de base de datos con 100 números (00-99) y 4 sorteos oficiales.'
);
