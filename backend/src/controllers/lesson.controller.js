// ============================================
// Contrôleur des leçons
// CRUD des leçons d'un cours (géré par l'admin)
// ============================================

const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');

// === CRÉER UNE LEÇON (ADMIN) ===
// POST /api/courses/:courseId/lessons
exports.createLesson = async (req, res) => {
  try {
    const { title, content, video_url, order_index } = req.body;
    const courseId = req.params.courseId;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const lesson = await Lesson.create({
      course_id: courseId,
      title,
      content,
      video_url,
      order_index: order_index || 0
    });

    res.status(201).json({ message: 'Leçon créée', lesson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === METTRE À JOUR UNE LEÇON (ADMIN) ===
// PUT /api/lessons/:id
exports.updateLesson = async (req, res) => {
  try {
    const { title, content, video_url, order_index } = req.body;
    const lesson = await Lesson.update(req.params.id, {
      title, content, video_url, order_index
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Leçon introuvable' });
    }
    res.json({ message: 'Leçon mise à jour', lesson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === SUPPRIMER UNE LEÇON (ADMIN) ===
// DELETE /api/lessons/:id
exports.deleteLesson = async (req, res) => {
  try {
    const deleted = await Lesson.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Leçon introuvable' });
    }
    res.json({ message: 'Leçon supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === MARQUER UNE LEÇON COMME TERMINÉE (USER) ===
// POST /api/lessons/:id/complete
exports.completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Leçon introuvable' });
    }

    // Récupère le score éventuel
    const { score } = req.body;

    const progress = await Progress.completeLesson({
      user_id: req.user.id,
      course_id: lesson.course_id,
      lesson_id: lesson.id,
      score
    });

    // Calcule le nouveau pourcentage de progression du cours
    const percentage = await Progress.getPercentage(req.user.id, lesson.course_id);

    res.json({ message: 'Leçon complétée', progress, coursePercentage: percentage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
