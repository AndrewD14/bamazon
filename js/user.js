//imports the npm modules
var inquirer = require('inquirer');

//imports local files
var connection = require('./database.js');
var customer = null;
var admin = null;
var manager = null;

//global variable
var login_user = null;

//greets the recently logged in user
var greetings = function(){
	console.log("Welcome, "+login_user.firstName +" "+login_user.lastName+".");
}

//gets the choice if the user wants to log in or signup
var enterApp = function(){
	inquirer.prompt([
		{
			name: "action",
			message: "What would you like to do?",
			type: "list",
			choices: ["login", "signup", "exit"]
		}
	]).then(function(result){
		if(result.action == "login")
			login();
		else if(result.action == "signup")
			signUp();
		else
			console.log("Goodbye");
	});
}

//gets user inputs to log in
var login = function(){
	inquirer.prompt([
		{
			name: "username",
			message: "Enter username:"
		},
		{
			name: "password",
			message: "Enter password:",
			type: "password"
		}
	]).then(function(answers){
		connection.logIn([answers.username, answers.password])
		.then(function(results){
				if(results.roleTypes.length > 0){
					login_user = results;
					greetings();
					pickMainOption();
				}
				else{
					console.log("Invalid username/password.");
					login();
				}
		})
		.catch(function(error){
			console.log("ERROR: "+error);
		});
	});
}

//function for signing up
var signUp = function(connection){
	inquirer.prompt([
		{
			name: "username",
			message: "Enter username:"
		},
		{
			name: "password",
			message: "Enter password:",
			type: "password"
		},
		{
			name: "f_name",
			message: "Enter your first name:"
		},
		{
			name: "l_name",
			message: "Enter your last name:"
		}
	]).then(function(answers){
		connection.addCustomer([answers.username, answers.f_name, answers.l_name, answers.password])
		.then(function(results){
			if(results == null)
				console.log("Fail to add a user.");
			else{
				console.log(results+" Please try to log in.");
				login();
			}
		})
		.catch(function(error){
			console.log("ERROR: "+error);
		});
	});
}

//ask the user what they first would like to do
var pickMainOption = function(){
	//adds in the role types
	if(login_user.roleTypes.length == 1 && login_user.roleTypes[0].role == 'C'){
		customer = require('./customer.js');
		customer.pickSubOption(connection, login_user.userId);
	}
	else{
		var question = {
			name: "mainChoice",
			message: "What section of app would you like to use?",
			choices: [],
			type: "rawlist"
		};

		for(i in login_user.roleTypes){
			question.choices.push(login_user.roleTypes[i].description);
		}

		question.choices.push("Exit");

		inquirer.prompt(question)
		.then(function(picked){
			if(picked.mainChoice == "Exit"){
				console.log("Goodbye.");
				connection.closeConnection();
			}
			else{
				var index = 0;
				var found = false;
				var choice = "";

				do{
					if(picked.mainChoice == login_user.roleTypes[index].description){
						found = true;
						choice = login_user.roleTypes[index].role;
					}
					else
						index++;
				}while (index < login_user.roleTypes && !found);

				if(choice == 'C'){
					customer = require('./bamazonCustomer.js');
					customer.pickSubOption(connection, login_user.userId);
				}
				else if(choice == 'A'){

				}
			}
		});
	}
}

//exports the function for other files to use
module.exports = {enterApp: enterApp};