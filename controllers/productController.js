const { Product, Review } = require('../models');
const { Op } = require('sequelize');

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

exports.list = async (req, res, next) => {
  try {
    const { q, category, featured, active = '1' } = req.query;
    const where = {};
    if (active !== 'all') where.active = active === '1';
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (category) where.category = category;
    if (featured === '1') where.featured = true;
    const products = await Product.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(products);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ msg: 'Produit introuvable' });
    res.json(p);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.name || !data.price) return res.status(400).json({ msg: 'Nom et prix requis' });
    data.slug = slugify(data.name);
    if (!data.images) data.images = [];
    const p = await Product.create(data);
    res.status(201).json(p);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ msg: 'Produit introuvable' });
    if (req.body.name) req.body.slug = slugify(req.body.name);
    await p.update(req.body);
    res.json(p);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ msg: 'Produit introuvable' });
    await p.destroy();
    res.json({ msg: 'Produit supprimé' });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const total = await Product.count();
    const outOfStock = await Product.count({ where: { stock: 0 } });
    const lowStock = await Product.count({ where: { stock: { [Op.gt]: 0, [Op.lte]: 5 } } });
    res.json({ total, outOfStock, lowStock });
  } catch (err) { next(err); }
};
