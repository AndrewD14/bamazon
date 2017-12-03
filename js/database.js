var mysql = require('mysql');
var Promises = require("bluebird");

//sets up the connection pool parameters
var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'bamazon_user',
  password : 'bamazon',
  database : 'bamazon',
  connectionLimit: 1
});

//gets a list of all products
exports.getProducts = function(){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			connection.query('SELECT item_id, product_name, price, stock_quantity FROM products', function (error, results, fields){
				if(error) return reject(error);

				var products = [];

				for(i in results){
					products.push({
						itemId: results[i].item_id,
						name: results[i].product_name,
						price: results[i].price,
						stock: results[i].stock_quantity
					});
				}

				connection.release();
				return resolve(products);
			});
		});
	});	
}

//gets all info on a specific product
exports.getSpecificProduct = function(id){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);
			
			var sql = "SELECT item_id, product_name, price, stock_quantity FROM products WHERE item_id = ?";
			connection.query(mysql.format(sql, [id]), function (error, results, fields) {
	  			if (error){
	  				connection.release();
	  				return reject(error);
	  			};

	  			connection.release();
	  			if(results[0]){
	  				return resolve({
	  					itemId: results[0].item_id,
						name: results[0].product_name,
						price: results[0].price,
						stock: results[0].stock_quantity
	  				});
	  			}
	  			return resolve(null);
	  		});
		});
	});
}

//logs user in
exports.logIn = function(values){
	var sql = "SELECT u.user_id, f_name, l_name, role_type, description "+
			"FROM users u "+
			"INNER JOIN user_role ur "+
			"ON u.user_id = ur.user_id "+
			"INNER JOIN roles r "+
			"ON ur.role_id = r.role_id "+
			"WHERE login_id = ? "+
			"AND password = ?";
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if (error) return reject(error);

			connection.query(mysql.format(sql, values), function(error, results, fields){
				if (error) return reject(error);

				var user = {
					userId: -1,
					firstName: "",
					lastName: "",
					roleTypes: []
				};

				//loops through the results and pulls out the role_types
				for(i in results){
					if(i == 0){
						user.userId = results[i].user_id;
						user.firstName = results[i].f_name;
						user.lastName = results[i].l_name;
						user.roleTypes.push({role: results[i].role_type, description: results[i].description});
					}
					else
						if(results[i].f_name != user.firstName || results[i].l_name != user.lastName)
					return reject("Error: More than 1 user pulled.");
				else
					user.roleTypes.push({role: results[i].role_type, description: results[i].description});
				}
				connection.release();
				return resolve(user);
			});
		});
	});
}

//sign up to use app
exports.addCustomer = function(values){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if (error) return reject(error);

			connection.beginTransaction(function(error){
				if(error) reject(error);

				var sql = "INSERT INTO users (login_id, f_name, l_name, password) VALUES (?,?,?,?)";
				connection.query(mysql.format(sql, values), function(error, data){
					if(error){
						connection.rollback(function(){});
						connection.release();
						return reject(error);
					}

					var user_id = data.insertId;
					var role_sql = "INSERT INTO user_role (user_id, role_id) VALUES (?,?)";
					connection.query(mysql.format(role_sql, [user_id, 1]), function(error, data){
						if(error){
							connection.rollback(function(){});
							connection.release();
							return reject(error);
						}

						connection.commit(function(error){
							if(error){
								connection.rollback(function(){});
								connection.release();
								return reject(error);
							}
						});

						connection.release();
						return resolve("User was added.");
					});
				});
			});
		});
	});
}

//inserts a new order
exports.insertOrder = function(order, user_id){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			connection.beginTransaction(function(error){
				if(error) reject(error);

				var insertOrder = "INSERT INTO orders (user_id, timeplaced, status, total) VALUES (?,?,?,?)";
				var values = [user_id, order.timeplaced, order.status, order.total];
				connection.query(mysql.format(insertOrder, values), function(error, data){
					if(error){
						connection.rollback(function(){});
						connection.release();
						return reject(error);
					}

					var order_id = data.insertId;
					insertOrderItem(connection, order.items, order_id, 0, order.status)
					.then(function(results){
						connection.commit(function(error){
							if(error){
								connection.rollback(function(){});
								connection.release();
								return reject(error);
							}

							return resolve("Order was placed. Your order number is: "+order_id);
						});
					})
					.error(function(error){
						connection.rollback(function(){});
						connection.release();
						return reject(error);
					});
				});
			});
		});
	});
}

//inserts the items for the order
function insertOrderItem(connection, items, order_id, index, status){
	return new Promises(function(resolve, reject){
		if(index < items.length){
			var orderItem_sql = "INSERT INTO order_items (order_id, item_id, price, quantity) VALUES (?,?,?,?)";
			var values = [order_id, items[index].itemId, items[index].price, items[index].amount];
			connection.query(mysql.format(orderItem_sql, values), function(error, data){
				if(error){
					connection.rollback(function(){});
					connection.release();
					return reject(error);
				}

				if(status != "Backorder"){
					//updates the table for the specific item
					updateProductCount(connection, items[index].itemId, items[index].stock - items[index].amount)
					.then(function(results){
						insertOrderItem(connection, items, order_id, index+1, status)
						.then(function(results){
							return resolve("Done");
						})
						.error(function(error){
							return reject(error);
						});
					})
					.error(function(error){
						connection.rollback(function(){});
						connection.release();
						return reject(error);
					});
				}
				else
					insertOrderItem(connection, items, order_id, index+1, status)
					.then(function(results){
						return resolve("Done");
					})
					.error(function(error){
						return reject(error);
					});
			});
		}
		return resolve("Done");
	});
}

//function to update the product table
var updateProductCount = function(connection, item_id, amount){
	return new Promises(function(resolve, reject){
		if(amount >= 0){
			var updateProd = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
			connection.query(mysql.format(updateProd, [amount, item_id]), function(error, data){
				if(error) return reject(error);

				return resolve("Update success");
			});
		}
		else
			return reject("Amount updating stock to is less than 0;");
	});
}

//closes the pool
exports.closeConnection = function(){
	pool.end(function (err) {
		if(err) throw err;
	});
}