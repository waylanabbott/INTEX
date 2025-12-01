// knexfile.js
// Make sure to set these variables in your .env file
require('dotenv').config(); 

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