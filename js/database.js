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


//closes the pool
exports.closeConnection = function(){
	pool.end(function (err) {
		if(err) throw err;
	});
}