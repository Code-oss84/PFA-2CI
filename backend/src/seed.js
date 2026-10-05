// ============================================
// Script de seed - Données de démonstration
// Crée un compte admin, un compte user,
// des cours et des leçons d'exemple
// ============================================

const dotenv = require('dotenv');
dotenv.config();

const initDatabase = require('./initDb');
const pool = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');

async function seed() {
  try {
    console.log('[SEED] Initialisation de la base...');
    await initDatabase();

    // === 1. Créer les utilisateurs ===

    // Vérifie si l'admin existe déjà
    const adminExists = await User.findByEmail('admin@eduvatar.com');
    let admin;
    if (!adminExists) {
      admin = await User.create({
        username: 'admin',
        email: 'admin@eduvatar.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('[SEED] Admin créé:', admin.username);
    } else {
      admin = adminExists;
      console.log('[SEED] Admin déjà existant');
    }

    // Vérifie si l'utilisateur test existe déjà
    const userExists = await User.findByEmail('user@eduvatar.com');
    let regularUser;
    if (!userExists) {
      regularUser = await User.create({
        username: 'etudiant',
        email: 'user@eduvatar.com',
        password: 'user123',
        role: 'user'
      });
      console.log('[SEED] Utilisateur créé:', regularUser.username);
    } else {
      regularUser = userExists;
      console.log('[SEED] Utilisateur déjà existant');
    }

    // === 2. Créer des cours d'exemple ===

    const coursesData = [
      {
        title: 'Mathématiques - Les fractions',
        description: 'Apprenez les fractions de manière interactive avec votre avatar.',
        level: 'beginner',
        category: 'Mathématiques'
      },
      {
        title: 'Français - La conjugaison',
        description: 'Maîtrisez les verbes et leurs conjugaisons au présent.',
        level: 'beginner',
        category: 'Français'
      },
      {
        title: 'Sciences - Le système solaire',
        description: 'Découvrez les planètes et mystères de notre système solaire.',
        level: 'intermediate',
        category: 'Sciences'
      }
    ];

    for (const courseData of coursesData) {
      // Vérifie si le cours existe déjà
      const existing = await pool.query('SELECT id FROM courses WHERE title = $1', [courseData.title]);
      if (existing.rows.length > 0) {
        console.log('[SEED] Cours déjà existant:', courseData.title);
        continue;
      }

      const course = await Course.create({
        ...courseData,
        created_by: admin.id
      });
      console.log('[SEED] Cours créé:', course.title);

      // === 3. Créer des leçons pour chaque cours ===
      const lessonTitles = [
        'Introduction',
        'Les fondamentaux',
        'Exercices pratiques',
        'Évaluation finale'
      ];

      for (let i = 0; i < lessonTitles.length; i++) {
        await Lesson.create({
          course_id: course.id,
          title: `${courseData.title} - ${lessonTitles[i]}`,
          content: `Bienvenue dans ce cours ! Cette leçon couvre les notions essentielles de : ${courseData.title}. Prenez votre temps et n'hésitez pas à poser des questions à votre avatar.`,
          order_index: i + 1
        });
      }
      console.log(`[SEED] ${lessonTitles.length} leçons créées pour '${course.title}'`);
    }

    console.log('==========================================');
    console.log('[SEED] Terminé avec succès !');
    console.log('  Admin  : admin@eduvatar.com / admin123');
    console.log('  User   : user@eduvatar.com / user123');
    console.log('==========================================');

  } catch (err) {
    console.error('[SEED] Erreur:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
