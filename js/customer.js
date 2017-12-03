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

//finalizes the order
var insertOrder = function(connection, order, userId){
	var subTotal = 0;
	console.log("Current Order");
	console.log("Product\t\tPrice\t\tAmount\t\tProduct Total");
	for(i in order){
		var item_total = order[i].amount*order[i].price;
		subTotal+= item_total;

		console.log(order[i].name+"\t\t"+order[i].price+"\t\t"+order[i].amount+"\t\t"+item_total);
	}
	console.log("Order Subtotal: "+subTotal);

	validateQuantity(connection, 0, order, userId);
}

//function to check the quantity and flag if the order can be placed or has to be put on backorder
function validateQuantity(connection, index, order, userId){
	if(index < order.length){
		connection.getSpecificProduct(order[index].id)
		.then(function(item){
			if(item.stock >= order[index].amount){
				order[index].status = true;
				order[index].stock = item.stock;
			}
			else
				order[index].status = false;

			
			validateQuantity(connection, index+1, order, userId);
		});
	}
	else{
		var orderStatus = "Ordered";
		for(i in order){
			if(!order[i].status){
				console.log("Order is placed on backorder due to insufficient quantity of "+order[i].name+".");
				orderStatus = "Backorder";
			}
		}

		var newOrder = {
			userId: userId,
			total: 0,
			status: orderStatus,
			timeplaced: new Date(),
			items: []
		};

		for(i in order){
			newOrder.total += order[i].amount*order[i].price;
			newOrder.items.push({itemId: order[i].id, price: order[i].price, amount: order[i].amount, stock: order[i].stock});
		}

		connection.insertOrder(newOrder, userId)
		.then(function(result){
			console.log(result);
		})
		.error(function(error){
			console.log(error);
		});
	}
}
