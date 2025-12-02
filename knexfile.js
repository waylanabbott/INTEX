require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.RDS_HOSTNAME || 'awseb-e-2zsmnexgnv-stack-awsebrdsdatabase-wguhpqqhmbo1.cpyq0oiq43rn.us-east-2.rds.amazonaws.com',
      port: process.env.RDS_PORT || 5432,
      user: process.env.RDS_USERNAME || 'group25',
      password: process.env.RDS_PASSWORD || 'MysteriousTurtle1!',
      database: process.env.RDS_DB_NAME || 'ebdb',
      ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false 
    },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.RDS_HOSTNAME || 'awseb-e-2zsmnexgnv-stack-awsebrdsdatabase-wguhpqqhmbo1.cpyq0oiq43rn.us-east-2.rds.amazonaws.com',
      port: process.env.RDS_PORT || 5432,
      user: process.env.RDS_USERNAME || 'group25',
      password: process.env.RDS_PASSWORD || 'MysteriousTurtle1!',
      database: process.env.RDS_DB_NAME || 'ebdb',
      ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false 
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './migrations' }
  }
};
