// knexfile.js
// Make sure to set these variables in your .env file
require('dotenv').config(); 

const express = require("express");

const session = require("express-session");

let path = require("path");

let bodyParser = require("body-parser");

let app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

const port = process.env.PORT || 3000;

app.use(
  session(
      {
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
      }
  )
);

module.exports = {
  // --- Development Configuration ---
development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1', // Default to local host
      port: process.env.DB_PORT || 5432,       // Default PostgreSQL port
    user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_dev_password', // CHANGE THIS
    database: process.env.DB_NAME || 'ella_rises_dev'
    },
    // Specify where Knex can find your migration files
    migrations: {
    directory: './migrations'
    },
    // Specify where Knex can find your seed files
    seeds: {
    directory: './seeds'
    }
},

  // --- Production Configuration (for deployment) ---
production: {
    client: 'pg',
    connection: process.env.DATABASE_URL, // Use a single connection string URL for deployment
    pool: {
    min: 2,
    max: 10
    },
    migrations: {
    directory: './migrations'
    }
}
};

app.get("/", (req, res) => {
  if (req.session.isLoggedIn) {
      const username = req.session.username
      const userLevel = req.session.level
      res.render('index', {username : username, userLevel : userLevel})
  }
  else {
      res.render("login", { error_message: "" });
  }
});



app.listen(port, () => {
  console.log(`INTEX project running on port ${port}`);
});