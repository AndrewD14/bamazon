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

//closes the pool
exports.closeConnection = function(){
	pool.end(function (err) {
		if(err) throw err;
	});
}