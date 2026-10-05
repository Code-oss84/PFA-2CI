// ============================================
// Contrôleur d'authentification
// Gère l'inscription et la connexion des utilisateurs
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fonction utilitaire : génère un token JWT pour un utilisateur
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// === INSCRIPTION ===
// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation basique des champs
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifie que l'email n'existe pas déjà
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifie que le username n'existe pas déjà
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Ce nom est déjà utilisé' });
    }

    // Crée l'utilisateur (par défaut avec le rôle 'user')
    const user = await User.create({ username, email, password, role: 'user' });

    // Génère le token JWT pour une connexion automatique
    const token = generateToken(user);

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === CONNEXION ===
// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Recherche l'utilisateur par email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Vérifie le mot de passe
    const isValid = await User.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Génère le token JWT
    const token = generateToken(user);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === PROFIL ACTUEL ===
// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    // L'utilisateur est déjà attaché à req par le middleware
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
