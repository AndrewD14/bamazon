create user 'bamazon_user'@'localhost' IDENTIFIED BY 'bamazon';

GRANT UPDATE, DELETE, SELECT, INSERT ON BAMAZON.* to 'bamazon_user'@'localhost';