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
	var insertNewDep = "Create New Department";
	var exit = "Exit";

	question.choices.push(viewSalesByDepartment);
	question.choices.push(insertNewDep);
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
		else if(picked.mainChoice == insertNewDep){
			insertNewDepartment(connection)
			.then(function(results){
				console.log(results);
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
	});
}

//gets a list of products
var displayDepartmentSales = function(results){
	if(results.length > 0){
		console.log("Department ID".padEnd(17)+"Department Name".padEnd(30)+"Over Head Cost".padEnd(17)+"Product Sales".padEnd(17)+"Total Profit");
		for(i in results){
			var profit = "";
			if(results[i].profit){
				if(results[i].profit < 0)
					profit += "("+Math.abs(results[i].profit)+")";
				else
					profit += ("$"+results[i].profit);
			}

			var ohc = "";
			if(results[i].overHeadCost)
				ohc += ("$"+results[i].overHeadCost);

			var sales = "";
			if(results[i].sales)
				sales += ("$"+results[i].sales);

			console.log((""+results[i].departmentId).padEnd(17)+
						results[i].name.padEnd(30)+
						(ohc).padEnd(17)+
						(sales).padEnd(17)+
						profit);
		}
	}
	else
		console.log("Nothing to display.");
}

//gets the user's input for inserting a new department
function insertNewDepartment(connection){
	return new Promises(function(resolve, reject){
		inquirer.prompt([
			{
				name: "name",
				message: "Enter the name of the new department: "
			},
			{
				name: "desc",
				message: "Enter the description of the new department: "
			},
			{
				name: "ohc",
				message: "Enter the amount for the over head cost: ",
				validation: validateForPositiveFloat
			}
		]).then(function(answers){
			connection.insertNewDepartment([answers.name, answers.desc, parseFloat(answers.ohc)])
			.then(function(results){
				return resolve(results);
			})
			.error(function(error){
				return reject(error);
			});
		});
	});
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