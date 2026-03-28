const { User } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res, next) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (q) where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ];
    if (role) where.role = role;
    const { rows: users, count } = await User.findAndCountAll({
      where, attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ users, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });
    res.json(u);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });
    const { name, email, phone, role, active } = req.body;
    if (name) u.name = name;
    if (email) u.email = email;
    if (phone !== undefined) u.phone = phone;
    if (role) u.role = role;
    if (active !== undefined) u.active = active;
    await u.save();
    res.json({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });
    if (u.role === 'admin') return res.status(403).json({ msg: 'Impossible de supprimer un admin' });
    await u.destroy();
    res.json({ msg: 'Utilisateur supprimé' });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const total = await User.count();
    const admins = await User.count({ where: { role: 'admin' } });
    const inactive = await User.count({ where: { active: false } });
    res.json({ total, admins, regular: total - admins, inactive });
  } catch (err) { next(err); }
};
