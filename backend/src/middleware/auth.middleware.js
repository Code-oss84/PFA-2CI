// ============================================
// Middleware d'authentification JWT
// Vérifie le token JWT dans le header Authorization
// Ajoute l'utilisateur authentifié à la requête
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware principal : vérifie que l'utilisateur est authentifié
async function authenticate(req, res, next) {
  try {
    // Récupère le header Authorization
    // Format attendu : "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    // Extrait le token sans le préfixe "Bearer "
    const token = authHeader.split(' ')[1];

    // Vérifie et décode le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupère l'utilisateur correspondant depuis la base
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    // Ajoute l'utilisateur à la requête pour les prochains middleware/handlers
    req.user = user;
    next();
  } catch (err) {
    // Token invalide ou expiré
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session invalide ou expirée' });
    }
    return res.status(500).json({ error: err.message });
  }
}

// Middleware pour vérifier que l'utilisateur est un administrateur
// Doit être utilisé APRÈS le middleware 'authenticate'
function authorizeAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
}

module.exports = { authenticate, authorizeAdmin };
