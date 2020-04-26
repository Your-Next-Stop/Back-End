const Sequelize = require('sequelize');

const {
  // DATABASE,
  // USER_NAME,
  // USER_PASSWORD,
  // HOST,
  // PORT,
  DATABASE_URL,
} = process.env;

module.exports = new Sequelize(DATABASE_URL);

// module.exports = new Sequelize(DATABASE, USER_NAME, USER_PASSWORD,
//   {
//     host: HOST,
//     port: PORT,
//     dialect: 'postgres',
//   });

// module.exports = new Sequelize('postgres://postgres:postgres@localhost:5432/your-next-stop');
