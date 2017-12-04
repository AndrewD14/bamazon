//imports the npm modules
var inquirer = require('inquirer');
var Promises = require("bluebird");


//options for the manger to choose what to do
var pickSubOption = function(connection, id){
	var question = {
		name: "mainChoice",
		message: "What would you like to do?",
		choices: [],
		type: "list"
	};

	var viewProducts = "View Products for Sale";
	var viewLowInventory = "View Low Inventory";
	var addInventory = "Add to Inventory";
	var updateInv = "Update Inventory";
	var addNewProduct = "Add New Product";
	var exit = "Exit";

	question.choices.push(viewProducts);
	question.choices.push(viewLowInventory);
	question.choices.push(addInventory);
	question.choices.push(updateInv);
	question.choices.push(addNewProduct);
	question.choices.push(exit);

	inquirer.prompt(question)
	.then(function(picked){
		if(picked.mainChoice == viewProducts){
			connection.getProducts()
			.then(function(results){
				displayProducts(results);
				pickSubOption(connection, id);
			})
			.error(function(error){
				console.log(error);
				pickSubOption(connection, id);
			});
		}
		else if(picked.mainChoice == viewLowInventory){
			connection.getLowInventoryProducts()
			.then(function(results){
				displayProducts(results);
				pickSubOption(connection, id);
			})
			.error(function(error){
				console.log(error);
				pickSubOption(connection, id);
			});
		}
		else if(picked.mainChoice == addInventory){
			addToInventory(connection)
			.then(function(results){
				console.log(results);
				pickSubOption(connection, id);
			})
			.error(function(error){
				console.log(error);
				pickSubOption(connection, id);
			});
		}
		else if(picked.mainChoice == updateInv){
			inquirer.prompt([
				{
					name: "continue",
					message: "This will change the inventory to the amount enter. Want to continue?",
					type: "confirm"
				}
			]).then(function(results){
				if(results.continue){
					updateInventory(connection)
					.then(function(results){
						console.log(results);
						pickSubOption(connection, id);
					})
					.error(function(error){
						console.log(error);
						pickSubOption(connection, id);
					});
				}
				else
					pickSubOption(connection, id);
			});
		}
		else if(picked.mainChoice == addNewProduct){
			insertNewProduct(connection)
			.then(function(result){
				console.log(result);
				pickSubOption(connection, id);
			})
			.error(function(error){
				console.log(error);
				pickSubOption(connection, id);
			});
		}
		else{
			console.log("Goodbye.");
			connection.closeConnection();
		}
	})
	.catch(function(error){
		console.log(error);
	});
}

//gets a list of products
var displayProducts = function(results){
	if(results.length > 0){
		console.log("Item Number".padEnd(15)+"Item".padEnd(30)+"Price".padEnd(7)+"Stock".padEnd(7)+"Department");
		for(i in results)
			console.log((""+results[i].itemId).padEnd(15)+
						results[i].name.padEnd(30)+
						("$"+results[i].price).padEnd(7)+
						(""+results[i].stock).padEnd(7)+
						results[i].departmentName);
	}
	else
		console.log("Nothing to display.");
}

//gets the info of which product the manager wants to change stock
var updateInventory = function(connection){
	return new Promises(function(resolve, reject){
		inquirer.prompt([
			{
				name: "item",
				message: "Enter the item ID you which to adjust the stock to be: "
			}
		]).then(function(answer){
			var id = parseInt(answer.item);
			if(id){
				connection.getSpecificProduct(id)
				.then(function(results){
					if(results){
						inquirer.prompt([
							{
								name: "amount",
								message: "Enter the new stock quantity for "+results.name+": ",
								validate: validateForPositiveNumber
							}
						]).then(function(answer){
							connection.updateQuantity(id, parseInt(answer.amount))
							.then(function(results){
								return resolve(results);
							})
							.error(function(error){
								return reject(error);
							});
						});
					}
				})
				.error(function(error){
					return reject("Error retrieving product info: "+error);
				});
			}
			else{
				return reject(answer.item+" is not a valid item id. Skipping input.");
			}
		});
	});
}

//gets the info of which product the manager wants to change stock
var addToInventory = function(connection){
	return new Promises(function(resolve, reject){
		inquirer.prompt([
			{
				name: "item",
				message: "Enter the item ID you which to increase the stock to be: "
			}
		]).then(function(answer){
			var id = parseInt(answer.item);
			if(id){
				connection.getSpecificProduct(id)
				.then(function(results){
					if(results){
						inquirer.prompt([
							{
								name: "amount",
								message: "Enter the amount to increase the stock quantity for "+results.name+": ",
								validate: validateForPositiveNumber
							}
						]).then(function(answer){
							connection.increaseQuantity(id, parseInt(answer.amount))
							.then(function(results){
								return resolve(results);
							})
							.error(function(error){
								return reject(error);
							});
						});
					}
				})
				.error(function(error){
					return reject("Error retrieving product info: "+error);
				});
			}
			else{
				return reject(answer.item+" is not a valid item id. Skipping input.");
			}
		});
	});
}

//gets the user input to insert a new product
var insertNewProduct = function(connection){
	return new Promises(function(resolve, reject){
		connection.getDepartmentInfo()
		.then(function(result){
			displayDepartment(result);

			inquirer.prompt([
				{
					name: "pName",
					message: "Enter the product name: "
				},
				{
					name: "price",
					message: "Enter the price for the new product: ",
					validate: validateForPositiveFloat
				},
				{
					name: "quantity",
					message: "Enter the current stock: ",
					validate: validateForPositiveNumber
				},
				{
					name: "departmentId",
					message: "Enter the id of the department the product belongs to: ",
					validate: validateForPositiveNumber
				}
			]).then(function(answers){
				connection.insertNewProduct([answers.pName, parseFloat(answers.price), parseInt(answers.quantity), parseInt(answers.departmentId)])
				.then(function(result){
					return resolve(result);
				})
				.error(function(error){
					return reject(error);
				});
			});
		})
		.error(function(error){
			return reject(error);
		});
	});
}

//displays the department info for the user to know the id
var displayDepartment = function(departments){
	console.log("Department ID\tDepartment Name");
	for(i in departments){
		console.log(departments[i].departmentId+"\t\t"+departments[i].name);
	}
}

//validates for an integer
function validateForNumber(amount){
	if(parseInt(amount))
		return true;
	else
		return false || "Amount should be a whole number!";
}

//validates for an integer
function validateForPositiveNumber(amount){
	if(parseInt(amount))
		if(parseInt(amount) > 0)
			return true;
		else
			return false || "Amount needs to be greater than 0!";
	else
		return false || "Amount should be a whole number!";
}

//validates for a positive float
function validateForPositiveFloat(amount){
	if(parseFloat(amount))
		if(parseFloat(amount) > 0)
			return true;
		else
			return false || "Amount needs to be greater than 0.0!";
	else
		return false || "Amount should be a number!";
}

//exports the function for other files to use
module.exports = {pickSubOption: pickSubOption};