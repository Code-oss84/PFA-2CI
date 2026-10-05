// ============================================
// Configuration de l'environnement de production
// Utilise des chemins relatifs : les appels passent
// par nginx (même origine) → aucun problème CORS
// ============================================

export const environment = {
  production: true,
  // URL de l'API backend (relative → redirigée par nginx vers le backend)
  apiUrl: '/api',
  // URL de base pour les fichiers uploadés (relative → proxy nginx)
  uploadUrl: '/uploads'
};