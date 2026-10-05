// ============================================
// Contrôleur des statistiques (Dashboard)
// Calcule les statistiques pour l'administration
// (nombre d'utilisateurs, conversations, messages,
//  progression moyenne, etc.)
// ============================================

const pool = require('../config/db');

// === STATISTIQUES GLOBALES ===
// GET /api/stats
// Réservé à l'admin
exports.getGlobalStats = async (req, res) => {
  try {
    // Requêtes SQL pour calculer les statistiques
    const [users, courses, avatars, conversations, messages, progress, recentActivity] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM courses'),
      pool.query('SELECT COUNT(*) as count FROM avatars'),
      pool.query('SELECT COUNT(*) as count FROM conversations'),
      pool.query('SELECT COUNT(*) as count FROM messages'),
      pool.query('SELECT COUNT(*) as count FROM progress WHERE completed = true'),
      pool.query(`
        SELECT m.content, m.sender, m.created_at, u.username
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        JOIN users u ON u.id = c.user_id
        ORDER BY m.created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      stats: {
        users: parseInt(users.rows[0].count),
        courses: parseInt(courses.rows[0].count),
        avatars: parseInt(avatars.rows[0].count),
        conversations: parseInt(conversations.rows[0].count),
        messages: parseInt(messages.rows[0].count),
        completedLessons: parseInt(progress.rows[0].count)
      },
      recentActivity: recentActivity.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === STATISTIQUES D'UN UTILISATEUR ===
// GET /api/stats/user
// Accessible à l'utilisateur connecté
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Statistiques propres à l'utilisateur
    const [conversations, messages, avatars, progress, coursesCompleted] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM conversations WHERE user_id = $1', [userId]),
      pool.query(`
        SELECT COUNT(*) as count FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE c.user_id = $1`, [userId]),
      pool.query('SELECT COUNT(*) as count FROM avatars WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM progress WHERE user_id = $1 AND completed = true', [userId]),
      pool.query(`
        SELECT COUNT(DISTINCT course_id) as count FROM progress
        WHERE user_id = $1 AND completed = true`, [userId])
    ]);

    // Les derniers cours complétés
    const recentCourses = await pool.query(`
      SELECT DISTINCT p.course_id, c.title, p.completed_at
      FROM progress p
      JOIN courses c ON c.id = p.course_id
      WHERE p.user_id = $1 AND p.completed = true
      ORDER BY p.completed_at DESC
      LIMIT 5`, [userId]);

    res.json({
      stats: {
        conversations: parseInt(conversations.rows[0].count),
        messages: parseInt(messages.rows[0].count),
        avatars: parseInt(avatars.rows[0].count),
        completedLessons: parseInt(progress.rows[0].count),
        coursesStarted: parseInt(coursesCompleted.rows[0].count)
      },
      recentCourses: recentCourses.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === STATISTIQUES PAR COURS ===
// GET /api/stats/by-course
// Nombre d'utilisateurs qui ont complété chaque cours
exports.getCourseStats = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.title,
             COUNT(DISTINCT p.user_id) as students,
             COUNT(DISTINCT l.id) as lesson_count
      FROM courses c
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN progress p ON p.course_id = c.id AND p.completed = true
      GROUP BY c.id
      ORDER BY students DESC
    `);
    res.json({ courses: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
