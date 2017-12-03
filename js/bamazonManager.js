//imports the npm modules
var inquirer = require('inquirer');
var Promises = require("bluebird");


//options for the customer to choose what to do
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
	var addNewProduct = "Add New Product";
	var exit = "Exit";

	question.choices.push(viewProducts);
	question.choices.push(viewLowInventory);
	question.choices.push(addInventory);
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

		}
		else if(picked.mainChoice == addNewProduct){

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
		console.log("Item Number\tItem\t\tPrice\t\tStock\t\tDepartment");
		for(i in results)
			console.log(results[i].itemId+"\t\t"+results[i].name+"\t\t"+results[i].price+"\t\t"+results[i].stock+"\t\t"+results[i].departmentName);
	}
	else
		console.log("Nothing to display.");
}

//exports the function for other files to use
module.exports = {pickSubOption: pickSubOption};