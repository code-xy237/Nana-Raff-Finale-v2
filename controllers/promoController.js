const { Promo } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const promos = await Promo.findAll({ order: [['createdAt', 'DESC']] });
    res.json(promos);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt, description } = req.body;
    if (!code || !value) return res.status(400).json({ msg: 'Code et valeur requis' });
    const exists = await Promo.findOne({ where: { code: code.toUpperCase() } });
    if (exists) return res.status(409).json({ msg: 'Code promo déjà existant' });
    const promo = await Promo.create({ code: code.toUpperCase(), type, value, minOrder, maxUses, expiresAt, description });
    res.status(201).json(promo);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Promo.findByPk(req.params.id);
    if (!p) return res.status(404).json({ msg: 'Promo introuvable' });
    await p.update(req.body);
    res.json(p);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const p = await Promo.findByPk(req.params.id);
    if (!p) return res.status(404).json({ msg: 'Promo introuvable' });
    await p.destroy();
    res.json({ msg: 'Promo supprimée' });
  } catch (err) { next(err); }
};

exports.validate = async (req, res, next) => {
  try {
    const { code, total } = req.body;
    const promo = await Promo.findOne({ where: { code: code.toUpperCase(), active: true } });
    if (!promo) return res.status(404).json({ msg: 'Code promo invalide' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(400).json({ msg: 'Code promo expiré' });
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.status(400).json({ msg: 'Code promo épuisé' });
    if (total && promo.minOrder > 0 && total < promo.minOrder) return res.status(400).json({ msg: `Commande minimum : ${promo.minOrder} FCFA` });
    const discount = promo.type === 'percent' ? Math.floor((total || 0) * promo.value / 100) : promo.value;
    res.json({ valid: true, promo, discount });
  } catch (err) { next(err); }
};
