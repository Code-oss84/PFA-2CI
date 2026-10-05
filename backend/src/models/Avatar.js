// ============================================
// Modèle Avatar - Gestion des avatars parlants
// Chaque avatar est créé à partir d'une photo
// et animé par SadTalker via Colab
// ============================================

const pool = require('../config/db');

class Avatar {
  // Crée un nouvel avatar
  static async create({ user_id, name, source_image }) {
    const { rows } = await pool.query(
      `INSERT INTO avatars (user_id, name, source_image)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, name, source_image]
    );
    return rows[0];
  }

  // Récupère tous les avatars d'un utilisateur
  static async findByUser(user_id) {
    const { rows } = await pool.query(
      'SELECT * FROM avatars WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  }

  // Récupère un avatar par son identifiant
  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM avatars WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  // Met à jour le statut et l'URL de la vidéo
  static async updateVideo(id, videoUrl, status) {
    const { rows } = await pool.query(
      `UPDATE avatars SET video_url = $2, status = $3 WHERE id = $1
       RETURNING *`,
      [id, videoUrl, status]
    );
    return rows[0];
  }

  // Met à jour le statut uniquement
  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      'UPDATE avatars SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return rows[0];
  }

  // Supprime un avatar
  static async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM avatars WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0];
  }
}

module.exports = Avatar;
