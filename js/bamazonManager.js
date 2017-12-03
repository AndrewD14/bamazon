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
		if(picked.mainChoice == viewProducts)
			displayProducts(connection)
			.then(function(results){
				pickSubOption(connection, id);
			});
		else if(picked.mainChoice == viewLowInventory){

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
var displayProducts = function(connection){
	return new Promises(function(resolve, reject){
		connection.getProducts()
		.then(function(results){
			products = results;

			if(products.length > 0){
				console.log("Item Number\tItem\t\tPrice\t\tStock\t\tDepartment");
				for(i in products)
					console.log(products[i].itemId+"\t\t"+products[i].name+"\t\t"+products[i].price+"\t\t"+products[i].stock+"\t\t"+products[i].departmentName);
			}
			return resolve("Success");
		})
		.catch(function(error){
			console.log("ERROR: "+error);
			return reject("Failure");
		});
	});
}

//exports the function for other files to use
module.exports = {pickSubOption: pickSubOption};