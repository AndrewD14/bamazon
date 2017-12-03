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

//bunch of nested inquirer to have the customer place an order
var placeOrder = function(connection, userId){
	inquirer.prompt([
		{
			name: "selection",
			message: "Enter the item ID of what you would like to buy, separated by a comma (ie: 1, 5, 9)"
		}
	]).then(function(answers){
		var selection = answers.selection.split(",");

		if(0 < selection.length)
			getAmountToOrder(connection, 0, selection, userId);
	});
}

//gets how many of each products the customer wants to order
function getAmountToOrder(connection, index, selection, userId){
	var id = parseInt(selection[index]);
	if(id){
		connection.getSpecificProduct(id)
		.then(function(results){
			if(results){
				inquirer.prompt([
					{
						name: "amount",
						type: "input",
						message: "How many "+results.name+" would you like to buy?",
						validate: validateForNumber
					}
				]).then(function(answer){
					newOrder.push({id: id, name: results.name, amount: parseInt(answer.amount), price: results.price});

					index++;
					if(index < selection.length)
						getAmountToOrder(connection, index, selection, userId);
					else
						insertOrder(connection, newOrder, userId);
				});
			}
		})
		.error(function(error){
			console.log("Error retrieving product info: "+error);
			index++;
			if(index < selection.length)
				getAmountToOrder(connection, index, selection, userId);
			else
				insertOrder(connection, newOrder, userId);
		});
	}
	else{
		console.log(selection[index]+" is not a valid item id. Skipping input.");
		index++;
		if(index < selection.length)
			getAmountToOrder(connection, index, selection, userId);
		else
			insertOrder(connection, newOrder, userId);
	}
}

//validates for an integer
function validateForNumber(amount){
	if(parseInt(amount))
		if(parseInt(amount) > 0)
			return true;
		else
			return false || "Amount should be greater than 0!";
	else
		return false || "Amount should be a whole number!";
}