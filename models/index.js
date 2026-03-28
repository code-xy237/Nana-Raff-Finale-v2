const sequelize = require('../config/db');
const User = require('./user');
const Product = require('./product');
const Review = require('./review');
const Order = require('./order');
const Promo = require('./promo');

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Product, Review, Order, Promo };
