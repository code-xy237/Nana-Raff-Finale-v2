const jwt = require('jsonwebtoken');
const { User } = require('../models');

function genToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Champs requis manquants' });
    if (password.length < 6) return res.status(400).json({ msg: 'Mot de passe trop court (min 6 caractères)' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ msg: 'Cet email est déjà utilisé' });
    const user = await User.create({ name, email, password, phone });
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: genToken(user)
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email et mot de passe requis' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ msg: 'Email ou mot de passe incorrect' });
    if (!user.active) return res.status(403).json({ msg: 'Compte désactivé' });
    const ok = await user.matchPassword(password);
    if (!ok) return res.status(401).json({ msg: 'Email ou mot de passe incorrect' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: genToken(user)
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    await user.save();
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ msg: 'Champs requis' });
    if (newPassword.length < 6) return res.status(400).json({ msg: 'Nouveau mot de passe trop court' });
    const user = await User.findByPk(req.user.id);
    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(401).json({ msg: 'Mot de passe actuel incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ msg: 'Mot de passe mis à jour' });
  } catch (err) { next(err); }
};
