const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Review extends Model {}
Review.init({
  productId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  name: DataTypes.STRING,
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: DataTypes.TEXT,
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
  approved: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, modelName: 'review' });

module.exports = Review;
