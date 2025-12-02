require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.RDS_HOSTNAME || 'localhost',
      port: process.env.RDS_PORT || 5432,
      user: process.env.RDS_USERNAME || 'postgres',
      password: process.env.RDS_PASSWORD || 'admin',
      database: process.env.RDS_DB_NAME || 'ellarises'
    },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './migrations' }
  }
};
