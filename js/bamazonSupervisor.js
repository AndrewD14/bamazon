//imports the npm modules
var inquirer = require('inquirer');
var Promises = require("bluebird");

//options for the supervisor to choose what to do
var pickSubOption = function(connection, id){
	var question = {
		name: "mainChoice",
		message: "What would you like to do?",
		choices: [],
		type: "list"
	};

	var viewSalesByDepartment = "View Product Sales by Department";
	var insertNewDepartment = "Create New Department";
	var exit = "Exit";

	question.choices.push(viewSalesByDepartment);
	question.choices.push(insertNewDepartment);
	question.choices.push(exit);

	inquirer.prompt(question)
	.then(function(picked){
		if(picked.mainChoice == viewSalesByDepartment){
			connection.getProductSalesByDepartment()
			.then(function(results){
				displayDepartmentSales(results);
				pickSubOption(connection, id);
			})
			.error(function(error){
				console.log(error);
				pickSubOption(connection, id);
			});
		}
		else if(picked.mainChoice == insertNewDepartment){
			
		}
		else{
			console.log("Goodbye.");
			connection.closeConnection();
		}
	});
}

//gets a list of products
var displayDepartmentSales = function(results){
	if(results.length > 0){
		console.log("Department ID".padEnd(17)+"Department Name".padEnd(30)+"Over Head Cost".padEnd(17)+"Product Sales".padEnd(17)+"Total Profit");
		for(i in results)
			var profit = "";
			if(results[i].profit < 0)
				profit += "("+Math.abs(results[i].profit)+")";
			else
				profit += ("$"+results[i].profit);

			console.log((""+results[i].departmentId).padEnd(17)+
						results[i].name.padEnd(30)+
						("$"+results[i].overHeadCost).padEnd(17)+
						("$"+results[i].sales).padEnd(17)+
						profit);
	}
	else
		console.log("Nothing to display.");
}

//exports the function for other files to use
module.exports = {pickSubOption: pickSubOption};