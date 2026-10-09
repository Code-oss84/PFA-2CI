// ============================================
// Configuration de l'environnement de développement
// Utilise des chemins relatifs : les appels passent
// par le proxy (proxy.conf.json) vers le backend → même
// origine, aucun problème CORS
// ============================================

export const environment = {
  production: false,
  // URL de l'API backend (relative → redirigée par le proxy ng serve)
  apiUrl: '/api'
};