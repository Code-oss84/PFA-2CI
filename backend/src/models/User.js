// ============================================
// Modèle User - Gestion des utilisateurs
// Fournit des méthodes statiques pour
// interagir avec la table 'users'
// ============================================

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Crée un nouvel utilisateur avec mot de passe haché
  static async create({ username, email, password, role = 'user' }) {
    // Hash le mot de passe (10 rounds de salage pour la sécurité)
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email, hashedPassword, role]
    );
    return rows[0];
  }

  // Trouve un utilisateur par son email
  static async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0];
  }

  // Trouve un utilisateur par son nom d'utilisateur
  static async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0];
  }

  // Trouve un utilisateur par son identifiant
  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, username, email, role, picture, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  // Récupère tous les utilisateurs (pour l'admin)
  static async findAll() {
    const { rows } = await pool.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  // Vérifie si le mot de passe est correct
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Met à jour un utilisateur
  static async update(id, fields) {
    const allowedFields = ['username', 'email', 'role', 'picture'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, username, email, role, picture, created_at`,
      values
    );
    return rows[0];
  }

  // Supprime un utilisateur
  static async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0];
  }
}

module.exports = User;
