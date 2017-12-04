#mock data for produt
USE bamazon;

#departments
INSERT INTO departments
(department_name,department_desc,over_head_cost)
VALUES
('Foods', '', 12000);

#Products
INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Banana", 1, .79, 15);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Frozen Pizza", 1, 4.99, 20);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Apple", 1, .69, 10);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Milk", 1, 2.49, 15);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Cheese", 1, 1.99, 12);

#departments
INSERT INTO departments
(department_name,department_desc,over_head_cost)
VALUES
('Toys', '', 12000);

#Products
INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Toy Truck", 2, 5.99, 15);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Nerf Gun", 2, 14.99, 10);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("R/C Car", 2, 24.99, 10);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Stuff Bear", 2, 4.49, 15);

INSERT INTO products
(product_name,department_id,price,stock_quantity)
VALUES
("Star Wars Lego", 2, 19.99, 20);


#user roles
INSERT INTO roles
(role_id, role_type, description)
VALUES
(1, 'C', 'Customer');

INSERT INTO roles
(role_id, role_type, description)
VALUES
(2, 'M', 'Manager');

INSERT INTO roles
(role_id, role_type, description)
VALUES
(3, 'S', 'Supervisor');

#user
INSERT INTO users
(login_id, f_name, l_name, password)
VALUES
('Manager', 'Andrew','Damico','1234');

INSERT INTO users
(login_id, f_name, l_name, password)
VALUES
('Supervisor', 'Sally','Sullivan','1234');

#user_roles
INSERT INTO user_role
(user_id, role_id)
VALUES
(1, 1);

INSERT INTO user_role
(user_id, role_id)
VALUES
(1, 2);

INSERT INTO user_role
(user_id, role_id)
VALUES
(2, 1);

INSERT INTO user_role
(user_id, role_id)
VALUES
(2, 3);