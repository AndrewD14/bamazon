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

//closes the pool
exports.closeConnection = function(){
	pool.end(function (err) {
		if(err) throw err;
	});
}