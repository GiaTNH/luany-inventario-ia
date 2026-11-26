USE luany_inventario;
DELETE FROM movimientos WHERE id > 0;

UPDATE productos SET stock_actual = 50  WHERE id = 1;
UPDATE productos SET stock_actual = 8   WHERE id = 2;
UPDATE productos SET stock_actual = 0   WHERE id = 3;
UPDATE productos SET stock_actual = 120 WHERE id = 4;
UPDATE productos SET stock_actual = 4   WHERE id = 5;

INSERT INTO movimientos (producto_id, tipo, cantidad, fecha, observacion) VALUES
(1, 'VENTA', 30, NOW(), 'Dato de prueba'),
(2, 'VENTA', 12, NOW(), 'Dato de prueba'),
(5, 'VENTA', 9,  NOW(), 'Dato de prueba'),
(4, 'VENTA', 2,  NOW(), 'Dato de prueba');