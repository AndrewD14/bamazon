# Bamazon

Node JS app that can be use to place orders, manage products, manage departments, and sign up to be able to place your orders and log back in to view them.

## Getting Started

Download the files. Run the SQL scripts in the order of:
```
1. create_schema.sql
2. create_user.sql
3. create_tables.sql
4. mock_data.sql
```
Note, the drop_tables.sql is provided if you need to remove all the tables.

Once done, you are able to run the application.

### Prerequisites

The application requires MySQL, Node, and NPM. Please install those ahead of running the files and application.

### Installing

Follow the getting started.

After you have completed the setup process for the database, navigate to the folder and run npm installer to install the npm packages required.

```
npm install
```

## Running the tests

The bamazon app mock data has some built in users to use. To get started, type node app.js inside the folder for the app.

```
node app.js
```

### Basic test accounts


```
Username: Manager     & Password: 1234
Username: Supervisor  & Password: 1234
```
If you want a basic customer, just signup through the app as it is running.

### Notes

To add more roles, or users with additional roles, use the following SQL statements:

```
To add a role:
INSERT INTO roles
(role_id, role_type, description)
VALUES
(1, 'C', 'Customer');

To add a user:
INSERT INTO users
(login_id, f_name, l_name, password)
VALUES
('username', 'Billy','Bob','1234');

To give the user a role
INSERT INTO user_role
(user_id, role_id)
VALUES
(1, 1);
```

## Demo
You can find a demo video here: https://www.youtube.com/watch?v=dkyIDuxulq8
* Hat tip to anyone who's code was used
* Inspiration
* etc
