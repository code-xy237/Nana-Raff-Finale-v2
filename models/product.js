const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Product extends Model {}
Product.init({
  name: { type: DataTypes.STRING, allowNull: false },
  slug: DataTypes.STRING,
  short: DataTypes.STRING,
  description: DataTypes.TEXT,
  price: { type: DataTypes.INTEGER, allowNull: false },
  originalPrice: { type: DataTypes.INTEGER },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  category: DataTypes.STRING,
  brand: DataTypes.STRING,
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  images: {
    type: DataTypes.TEXT, defaultValue: '[]',
    get() { return JSON.parse(this.getDataValue('images') || '[]'); },
    set(val) { this.setDataValue('images', JSON.stringify(val || [])); }
  },
  tags: {
    type: DataTypes.TEXT, defaultValue: '[]',
    get() { return JSON.parse(this.getDataValue('tags') || '[]'); },
    set(val) { this.setDataValue('tags', JSON.stringify(val || [])); }
  }
}, { sequelize, modelName: 'product' });

module.exports = Product;
