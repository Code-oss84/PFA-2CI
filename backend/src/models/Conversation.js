// ============================================
// Modèle Conversation - Gestion des sessions de chat
// Une conversation regroupe les messages
// échangés entre l'utilisateur et l'avatar
// ============================================

const pool = require('../config/db');

class Conversation {
  // Crée une nouvelle conversation
  static async create({ user_id, avatar_id, title }) {
    const { rows } = await pool.query(
      `INSERT INTO conversations (user_id, avatar_id, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, avatar_id, title]
    );
    return rows[0];
  }

  // Récupère toutes les conversations d'un utilisateur
  static async findByUser(user_id) {
    const { rows } = await pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
       FROM conversations c
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [user_id]
    );
    return rows;
  }

  // Récupère une conversation avec ses messages
  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  // Supprime une conversation
  static async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM conversations WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0];
  }
}

module.exports = Conversation;
