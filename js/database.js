var mysql = require('mysql');
var Promises = require("bluebird");

//sets up the connection pool parameters
var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'bamazon_user',
  password : 'bamazon',
  database : 'bamazon',
  connectionLimit: 2
});

//gets a list of all products
exports.getProducts = function(){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			var getProductInto = "SELECT distinct item_id, product_name, price, stock_quantity, department_name "+
								"FROM products p "+
								"INNER JOIN departments d "+
								"ON p.department_id = d.department_id";
			connection.query(getProductInto, function (error, results, fields){
				if(error) return reject(error);

				var products = [];

				for(i in results){
					products.push({
						itemId: results[i].item_id,
						name: results[i].product_name,
						price: results[i].price,
						stock: results[i].stock_quantity,
						departmentName: results[i].department_name
					});
				}

				connection.release();
				return resolve(products);
			});
		});
	});	
}

//gets a list of all products that have inventory less than 5
exports.getLowInventoryProducts = function(){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			var getProductInto = "SELECT distinct item_id, product_name, price, stock_quantity, department_name "+
								"FROM products p "+
								"INNER JOIN departments d "+
								"ON p.department_id = d.department_id "+
								"WHERE stock_quantity < 5";
			connection.query(getProductInto, function (error, results, fields){
				if(error) return reject(error);

				var products = [];

				for(i in results){
					products.push({
						itemId: results[i].item_id,
						name: results[i].product_name,
						price: results[i].price,
						stock: results[i].stock_quantity,
						departmentName: results[i].department_name
					});
				}

				connection.release();
				return resolve(products);
			});
		});
	});	
}

//gets all info on a specific product
var getSpecificProduct = function(id){
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
				if(error) return reject(error);

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
				if(error) return reject(error);

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
		var updateProd = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
		connection.query(mysql.format(updateProd, [amount, item_id]), function(error, data){
			if(error) return reject(error);

			return resolve("Update success");
		});
	});
}

//external function for updating a product
exports.updateQuantity = function(itemId, amount){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			connection.beginTransaction(function(error){
				if(error) return reject(error);

				updateProductCount(connection, itemId, amount)
				.then(function(result){
					connection.commit(function(error){
						if(error){
							connection.rollback(function(){});
							connection.release();
							return reject(error);
						}
					});
					connection.release();
					return resolve(result);
				})
				.error(function(error){
					connection.rollback(function(){});
					connection.release();
					return reject(error);
				});
			});
		});
	});
}

//external function for updating a product
exports.increaseQuantity = function(itemId, amount){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			connection.beginTransaction(function(error){
				if(error) return reject(error);

				getSpecificProduct(itemId)
				.then(function(result){
					updateProductCount(connection, itemId, result.stock+amount)
					.then(function(result){
						connection.commit(function(error){
							if(error){
								connection.rollback(function(){});
								connection.release();
								return reject(error);
							}
						});
						connection.release();
						return resolve(result);
					})
					.error(function(error){
						connection.rollback(function(){});
						connection.release();
						return reject(error);
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
}

//gets current orders for the user
exports.getOrders = function(userId){
	return new Promises(function(resolve, reject){
		var sql = "SELECT O.order_id, O.status, O.timeplaced, O.total, "+
				"OI.price, OI.quantity, round(OI.price * OI.quantity, 2) as 'item_total', "+
				"P.product_name "+
				"FROM ORDERS O "+
				"INNER JOIN ORDER_ITEMS OI "+
				"ON O.order_id = OI.order_id "+
				"INNER JOIN PRODUCTS P "+
				"ON OI.item_id = P.item_id "+
				"WHERE user_id = ? "+
				"ORDER BY O.order_id";

		pool.getConnection(function(error, connection){
			if (error) return reject(error);

			connection.query(mysql.format(sql, [userId]), function(error, results, fields){
				if(error) return reject(error);

				var orders = [];

				var order = {
					orderId: -1,
					status: "",
					timeplaced: null,
					orderTotal: 0,
					items: []
				};

				//builds the order summary object
				for(i in results){
					if(i == 0 || results[i].order_id != orders[orders.length-1].orderId){
						order = {
							orderId: -1,
							status: "",
							timeplaced: null,
							orderTotal: 0,
							items: []
						};
						order.orderId = results[i].order_id;
						order.status = results[i].status;
						order.orderTotal = results[i].total;
						order.timeplaced = results[i].timeplaced;
						order.items.push({
							product: results[i].product_name,
							price: results[i].price,
							quantity: results[i].quantity,
							total: results[i].item_total
						});

						orders.push(order);
					}
					else
						order.items.push({
							product: results[i].product_name,
							price: results[i].price,
							quantity: results[i].quantity,
							total: results[i].item_total
						});
					}

				connection.release();
				return resolve(orders);
			});
		});
	});
}

//inserts a new product for a specified department
exports.insertNewProduct = function(values){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			connection.beginTransaction(function(error){
				if(error) return reject(error);

				var sql = "INSERT INTO products (product_name,price,stock_quantity,department_id) VALUES (?,?,?,?)";
				connection.query(mysql.format(sql, values), function (error, results, fields) {
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
		  			return resolve("The new product "+values[0]+" was added successfully.");
		  		});
			});
		});
	});
}

//returns a list of the departments
exports.getDepartmentInfo = function(){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			var getDepartmentInto = "SELECT department_id, department_name, department_desc, over_head_cost "+
								"FROM departments";
			connection.query(getDepartmentInto, function (error, results, fields){
				if(error) return reject(error);

				var departments = [];

				for(i in results){
					departments.push({
						departmentId: results[i].department_id,
						name: results[i].department_name,
						desc: results[i].department_desc,
						overHeadCost: results[i].over_head_cost
					});
				}

				connection.release();
				return resolve(departments);
			});
		});
	});
}

//gets the product sales by department
exports.getProductSalesByDepartment = function(){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			var sql = "SELECT d.department_id, d.department_name, d.over_head_cost, "+
						"round(sum(tot_sales.total_sales), 2) as 'product_sales', "+
						"round(COALESCE(sum(tot_sales.total_sales),0)-d.over_head_cost, 2) as 'total_profit' "+
						"FROM departments d "+
						"LEFT OUTER JOIN products p "+
						"ON d.department_id = p.department_id "+
						"LEFT OUTER JOIN (SELECT sale1.item_id, sum(sale1.sales) as 'total_sales' "+
						"                FROM (SELECT item_id, price, sum(quantity), round(sum(quantity)*price,2) as 'sales' "+
						"                        FROM orders o "+
						"                        INNER JOIN order_items oi "+
						"                        ON o.order_id = oi.order_id "+
						"                        GROUP BY item_id, price) sale1 "+
						"                GROUP BY sale1.item_id) tot_sales "+
						"ON tot_sales.item_id = p.item_id "+
						"GROUP BY d.department_id, d.department_name, d.over_head_cost;";

			connection.query(sql, function (error, results, fields){
				if(error) return reject(error);

				var salesByDepartments = [];

				for(i in results){
					salesByDepartments.push({
						departmentId: results[i].department_id,
						name: results[i].department_name,
						overHeadCost: results[i].over_head_cost,
						sales: results[i].product_sales,
						profit: results[i].total_profit
					});
				}

				connection.release();
				return resolve(salesByDepartments);
			});
		});
	});
}

//inserts a new department
exports.insertNewDepartment = function(values){
	return new Promises(function(resolve, reject){
		pool.getConnection(function(error, connection){
			if(error) return reject(error);

			connection.beginTransaction(function(error){
				if(error) return reject(error);

				var sql = "INSERT INTO departments (department_name,department_desc,over_head_cost) VALUES (?,?,?)";
				connection.query(mysql.format(sql, values), function (error, results, fields) {
				  if (error) return reject(error);

				  connection.commit(function(error){
						if(error){
							connection.rollback(function(){});
							connection.release();
							return reject(error);
						}
					});
					connection.release();
					return resolve("The new department was added.");
				});
			});
		});
	});
}

//closes the pool
exports.closeConnection = function(){
	pool.end(function (err) {
		if(err) throw err;
	});
}

//exports the function for other files to use
module.exports.getSpecificProduct = getSpecificProduct;