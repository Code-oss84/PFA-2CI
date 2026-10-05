// ============================================
// Contrôleur des cours
// CRUD des cours (géré par l'admin)
// Consultation (accessible à tous les utilisateurs)
// ============================================

const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');

// === LISTER TOUS LES COURS ===
// GET /api/courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === RÉCUPÉRER UN COURS AVEC SES LEÇONS ===
// GET /api/courses/:id
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Cours introuvable' });
    }

    // Récupère les leçons du cours
    const lessons = await Lesson.findByCourse(course.id);

    // Récupère la progression de l'utilisateur (si connecté)
    let progress = null;
    if (req.user) {
      progress = await Progress.getPercentage(req.user.id, course.id);
    }

    res.json({ course, lessons, progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === CRÉER UN COURS (ADMIN) ===
// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const { title, description, level, category, image_url } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    // Le champ created_by est l'utilisateur admin connecté
    const course = await Course.create({
      title,
      description,
      level,
      category,
      image_url,
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Cours créé', course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === METTRE À JOUR UN COURS (ADMIN) ===
// PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, level, category, image_url } = req.body;
    const course = await Course.update(req.params.id, {
      title, description, level, category, image_url
    });
    if (!course) {
      return res.status(404).json({ error: 'Cours introuvable' });
    }
    res.json({ message: 'Cours mis à jour', course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === SUPPRIMER UN COURS (ADMIN) ===
// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const deleted = await Course.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cours introuvable' });
    }
    res.json({ message: 'Cours supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
