const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Order extends Model {}
Order.init({
  userId: DataTypes.INTEGER,
  customerName: DataTypes.STRING,
  customerEmail: DataTypes.STRING,
  customerPhone: DataTypes.STRING,
  deliveryAddress: DataTypes.TEXT,
  items: {
    type: DataTypes.TEXT,
    get() { return JSON.parse(this.getDataValue('items') || '[]'); },
    set(v) { this.setDataValue('items', JSON.stringify(v || [])); }
  },
  total: { type: DataTypes.INTEGER, allowNull: false },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'cash' },
  paymentInfo: DataTypes.TEXT,
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  notes: DataTypes.TEXT
}, { sequelize, modelName: 'order' });

module.exports = Order;
