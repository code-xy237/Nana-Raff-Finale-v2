const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Promo extends Model {}
Promo.init({
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: { type: DataTypes.STRING, defaultValue: 'percent' }, // percent | fixed
  value: { type: DataTypes.INTEGER, allowNull: false },
  minOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxUses: { type: DataTypes.INTEGER, defaultValue: 0 },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiresAt: DataTypes.DATE,
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  description: DataTypes.STRING
}, { sequelize, modelName: 'promo' });

module.exports = Promo;
