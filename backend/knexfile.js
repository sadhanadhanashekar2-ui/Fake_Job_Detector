const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'src/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src/seeds')
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'src/migrations')
    }
  }
};