const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'nanaraff.sqlite'),
  logging: false
});

module.exports = sequelize;
