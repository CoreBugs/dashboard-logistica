-- =============================================================
-- Dashboard Logística - Seed de productos y órdenes
-- Contraseña de todos los usuarios: password
-- =============================================================

-- Usuarios adicionales
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@dashboard.com', '$2a$10$p9x34Ff2YE18Hrf8G3oNSusRF3cepJP2VqlBQhubVKeYIjk94i8ES', 'admin');
('Carlos López',  'carlos@dashboard.com', '$2a$10$p9x34Ff2YE18Hrf8G3oNSusRF3cepJP2VqlBQhubVKeYIjk94i8ES', 'repartidor'),
('María González','maria@dashboard.com',  '$2a$10$p9x34Ff2YE18Hrf8G3oNSusRF3cepJP2VqlBQhubVKeYIjk94i8ES', 'repartidor'),
('Lucas Pérez',   'lucas@dashboard.com',  '$2a$10$p9x34Ff2YE18Hrf8G3oNSusRF3cepJP2VqlBQhubVKeYIjk94i8ES', 'admin');

-- Productos
INSERT INTO products (name, sku, stock, price) VALUES
('Notebook Lenovo IdeaPad',  'NB-LENOVO-001', 15,  850.00),
('Monitor Samsung 24"',      'MN-SAMS-024',   10,  320.00),
('Teclado Logitech MX Keys', 'TC-LOGI-MX',    30,   95.00),
('Mouse Logitech M705',      'MS-LOGI-705',   40,   45.00),
('Auriculares Sony WH-1000', 'AU-SONY-WH1',   20,  280.00),
('Webcam Logitech C920',     'WC-LOGI-C920',  12,  110.00),
('Disco SSD Kingston 1TB',   'SSD-KING-1TB',  25,  130.00),
('Memoria RAM 16GB DDR5',    'RAM-16GB-DDR5', 18,   75.00),
('Hub USB-C 7 puertos',      'HUB-USBC-007',  35,   40.00),
('Silla Ergonómica Pro',     'SI-ERGO-PRO',    8,  450.00);

-- Órdenes (product_id 1-10, variedad de estados)
INSERT INTO orders (product_id, quantity, total_price, status) VALUES
(1, 1,  850.00, 'entregado'),
(2, 2,  640.00, 'entregado'),
(3, 3,  285.00, 'entregado'),
(4, 5,  225.00, 'entregado'),
(5, 1,  280.00, 'entregado'),
(6, 2,  220.00, 'en viaje'),
(7, 1,  130.00, 'en viaje'),
(8, 4,  300.00, 'en viaje'),
(9, 3,  120.00, 'en viaje'),
(10,1,  450.00, 'en viaje'),
(1, 2, 1700.00, 'pendiente'),
(3, 5,  475.00, 'pendiente'),
(4, 2,   90.00, 'pendiente'),
(6, 1,  110.00, 'pendiente'),
(7, 3,  390.00, 'pendiente'),
(2, 1,  320.00, 'pendiente'),
(5, 2,  560.00, 'pendiente'),
(8, 2,  150.00, 'pendiente'),
(9, 5,  200.00, 'pendiente'),
(10,2,  900.00, 'pendiente');