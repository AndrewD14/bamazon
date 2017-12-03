#mock data for produt
USE bamazon;

#departments
INSERT INTO departments
(department_name,department_desc,over_head_cost)
VALUES
('Foods', '', 12000);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Banana", 1, 12.50, 10);


#user roles
INSERT INTO roles
(role_type, description)
VALUES
('C', 'customer roles');