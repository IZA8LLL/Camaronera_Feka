/* ═══════════════════════════════════════════════════════════
   By Fekas Corp. — Punto de Entrada Frontend (main.ts)
   Bootstrap de Aplicación Angular Standalone
   ═══════════════════════════════════════════════════════════ */
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initAuth } from './services/auth.service';

// Inicializar sesión y tokens almacenados
initAuth();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
