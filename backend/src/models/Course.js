// ============================================
// Modèle Course - Gestion des cours
// Les cours sont créés par l'admin et
// consultés par les utilisateurs
// ============================================

const pool = require('../config/db');

class Course {
  // Crée un nouveau cours (utilisé par l'admin)
  static async create({ title, description, level, category, image_url, created_by }) {
    const { rows } = await pool.query(
      `INSERT INTO courses (title, description, level, category, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, level, category, image_url, created_by]
    );
    return rows[0];
  }

  // Récupère tous les cours avec le nombre de leçons
  static async findAll() {
    const { rows } = await pool.query(
      `SELECT c.*, 
              COUNT(l.id) as lesson_count
       FROM courses c
       LEFT JOIN lessons l ON l.course_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return rows;
  }

  // Récupère un cours avec ses leçons
  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT c.*, 
              COUNT(l.id) as lesson_count
       FROM courses c
       LEFT JOIN lessons l ON l.course_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    return rows[0];
  }

  // Met à jour un cours
  static async update(id, fields) {
    const allowedFields = ['title', 'description', 'level', 'category', 'image_url'];
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
      `UPDATE courses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0];
  }

  // Supprime un cours
  static async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0];
  }
}

module.exports = Course;
