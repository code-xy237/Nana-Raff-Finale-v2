const { Sequelize } = require('sequelize');

// Railway injecte automatiquement DATABASE_URL quand tu ajoutes un plugin PostgreSQL
// En local on peut utiliser SQLite comme fallback pour le développement
let sequelize;

if (process.env.DATABASE_URL) {
  // ─── Production Railway / Render / Heroku : PostgreSQL ────────────────────
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false  // nécessaire pour Railway/Render
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // ─── Développement local : SQLite (aucune config requise) ─────────────────
  const path = require('path');
  const fs   = require('fs');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || path.join(dataDir, 'nanaraff.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
