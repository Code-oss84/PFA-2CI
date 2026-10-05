// ============================================
// Point d'entrée Angular
// Bootstrap l'application avec le module principal
// ============================================

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Lance le bootstrap de l'application
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
