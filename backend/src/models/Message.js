// ============================================
// Modèle Message - Gestion des messages
// Un message fait partie d'une conversation
// ============================================

const pool = require('../config/db');

class Message {
  // Crée un nouveau message
  static async create({ conversation_id, sender, content, media_url }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender, content, media_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversation_id, sender, content, media_url]
    );
    return rows[0];
  }

  // Récupère tous les messages d'une conversation
  static async findByConversation(conversation_id) {
    const { rows } = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversation_id]
    );
    return rows;
  }

  // Récupère le nombre total de messages (pour stats)
  static async count() {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM messages');
    return parseInt(rows[0].count);
  }
}

module.exports = Message;
