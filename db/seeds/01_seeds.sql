INSERT INTO users (username, password, balance) VALUES
('admin', 'admin123', 10000.00),
('deku', 'deku123', 1000.00),
('ninja', 'ninja123', 100.00);

INSERT INTO transactions (symbol, shares, price, user_id) VALUES
('BBY', 2, 99.50, 2),
('ZNGA', 3, 10.00, 3),
('ZNGA', 1, -5.00, 3);
