// ============================================
// Contrôleur des utilisateurs (géré par l'admin)
// CRUD complet des comptes utilisateurs
// ============================================

const User = require('../models/User');

// === LISTER TOUS LES UTILISATEURS ===
// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === RÉCUPÉRER UN UTILISATEUR ===
// GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === METTRE À JOUR UN UTILISATEUR ===
// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, picture } = req.body;

    // Seul un admin peut changer le rôle
    // Un utilisateur ne peut modifier que son propre profil
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Seul un admin peut changer le rôle' });
    }

    const updatedUser = await User.update(req.params.id, { username, email, role, picture });
    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === SUPPRIMER UN UTILISATEUR ===
// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    // Empêche la suppression de son propre compte par l'admin
    // (pour éviter de supprimer le dernier admin)
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const deleted = await User.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
