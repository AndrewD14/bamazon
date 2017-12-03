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