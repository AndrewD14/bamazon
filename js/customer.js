//imports the npm modules
var inquirer = require('inquirer');
var Promises = require("bluebird");

var products = null;
var newOrder = [];

//gets a list of products
var displayProducts = function(connection){
	return new Promises(function(resolve, reject){
		connection.getProducts()
		.then(function(results){
			products = results;

			if(products.length > 0){
				console.log("Item Number\tItem\t\tPrice");
				for(i in products)
					console.log(products[i].itemId+"\t\t"+products[i].name+"\t\t"+products[i].price);
			}
			return resolve("Success");
		})
		.catch(function(error){
			console.log("ERROR: "+error);
			return reject("Failure");
		});
	});
}