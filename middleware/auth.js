const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Support token in Authorization header OR ?token= query param (needed for PDF/Excel downloads)
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
  if (req.query.token) return req.query.token;
  return null;
}

const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ msg: 'Non autorisé' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    if (!user || !user.active) return res.status(401).json({ msg: 'Utilisateur introuvable ou désactivé' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalide ou expiré' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ msg: 'Accès administrateur requis' });
};

const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user && user.active) req.user = user;
    } catch (_) {}
  }
  next();
};

module.exports = { protect, admin, optionalAuth };
