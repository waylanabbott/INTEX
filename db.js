const knex = require("knex");
const config = require("./knexfile");
//this sets up the database connection using Knex.js
const environment = process.env.NODE_ENV || "development";
const db = knex(config[environment]);
//this exports the database connection for use in other parts of the application
module.exports = db;
