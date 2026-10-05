// ============================================
// Modèle Lesson - Gestion des leçons
// Chaque leçon est associée à un cours
// ============================================

const pool = require('../config/db');

class Lesson {
  // Crée une nouvelle leçon
  static async create({ course_id, title, content, video_url, order_index }) {
    const { rows } = await pool.query(
      `INSERT INTO lessons (course_id, title, content, video_url, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [course_id, title, content, video_url, order_index]
    );
    return rows[0];
  }

  // Récupère toutes les leçons d'un cours (ordonnées)
  static async findByCourse(course_id) {
    const { rows } = await pool.query(
      'SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC',
      [course_id]
    );
    return rows;
  }

  // Récupère une leçon par son identifiant
  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM lessons WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  // Met à jour une leçon
  static async update(id, fields) {
    const allowedFields = ['title', 'content', 'video_url', 'order_index'];
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
      `UPDATE lessons SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0];
  }

  // Supprime une leçon
  static async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM lessons WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0];
  }
}

module.exports = Lesson;
