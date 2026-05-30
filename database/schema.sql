-- =============================================================
-- Dashboard Logística - Schema inicial
-- Base de datos: dashboard_logistica_db
-- Creado: 2026-05-17
-- =============================================================

-- Eliminar tablas si ya existen (orden inverso por FK)
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- =============================================================
-- TABLA: users
-- Usuarios del sistema (administradores y repartidores)
-- =============================================================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(20)         NOT NULL DEFAULT 'repartidor'
                      CHECK (role IN ('admin', 'repartidor')),
    created_at    TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLA: products
-- Catálogo de productos disponibles para despacho
-- =============================================================
CREATE TABLE products (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(150)        NOT NULL,
    sku        VARCHAR(50)         NOT NULL UNIQUE,
    stock      INTEGER             NOT NULL DEFAULT 0
                   CHECK (stock >= 0),
    price      NUMERIC(10, 2)      NOT NULL
                   CHECK (price >= 0),
    created_at TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLA: orders
-- Órdenes / ventas generadas en el sistema
-- =============================================================
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER             NOT NULL
                    REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER             NOT NULL
                    CHECK (quantity > 0),
    total_price NUMERIC(10, 2)      NOT NULL
                    CHECK (total_price >= 0),
    status      VARCHAR(20)         NOT NULL DEFAULT 'pendiente'
                    CHECK (status IN ('pendiente', 'en viaje', 'entregado')),
    created_at  TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ÍNDICES para mejorar performance en búsquedas frecuentes
-- =============================================================
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_products_sku      ON products(sku);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
