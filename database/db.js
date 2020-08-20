const Sequelize = require('sequelize');

const {
  DATABASE_URL,
} = process.env;

module.exports = new Sequelize(DATABASE_URL);
