// ============================================
// Modèle Progress - Suivi de la progression
// Track la progression de l'utilisateur dans
// les leçons de chaque cours
// ============================================

const pool = require('../config/db');

class Progress {
  // Marque une leçon comme complétée pour un utilisateur
  static async completeLesson({ user_id, course_id, lesson_id, score = 0 }) {
    const { rows } = await pool.query(
      `INSERT INTO progress (user_id, course_id, lesson_id, completed, score, completed_at)
       VALUES ($1, $2, $3, true, $4, NOW())
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed = true, score = $4, completed_at = NOW()
       RETURNING *`,
      [user_id, course_id, lesson_id, score]
    );
    return rows[0];
  }

  // Récupère la progression d'un utilisateur pour un cours
  static async getCourseProgress(user_id, course_id) {
    const { rows } = await pool.query(
      `SELECT p.*, l.title as lesson_title
       FROM progress p
       JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = $1 AND p.course_id = $2
       ORDER BY l.order_index ASC`,
      [user_id, course_id]
    );
    return rows;
  }

  // Récupère toute la progression d'un utilisateur
  static async findByUser(user_id) {
    const { rows } = await pool.query(
      `SELECT p.*, c.title as course_title, l.title as lesson_title
       FROM progress p
       JOIN courses c ON c.id = p.course_id
       JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = $1 AND p.completed = true
       ORDER BY p.completed_at DESC`,
      [user_id]
    );
    return rows;
  }

  // Calcule le pourcentage de progression d'un cours
  static async getPercentage(user_id, course_id) {
    const lessons = await pool.query(
      'SELECT COUNT(*) as total FROM lessons WHERE course_id = $1',
      [course_id]
    );
    const completed = await pool.query(
      `SELECT COUNT(*) as done FROM progress
       WHERE user_id = $1 AND course_id = $2 AND completed = true`,
      [user_id, course_id]
    );
    const total = parseInt(lessons.rows[0].total);
    const done = parseInt(completed.rows[0].done);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }
}

module.exports = Progress;
