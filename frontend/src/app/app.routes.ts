import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PiscinasListComponent } from './pages/piscinas-list/piscinas-list.component';
import { FormAguaComponent } from './pages/form-agua/form-agua.component';
import { FormMuestreoComponent } from './pages/form-muestreo/form-muestreo.component';
import { FormAlimentacionComponent } from './pages/form-alimentacion/form-alimentacion.component';
import { ComprasComponent } from './pages/compras/compras.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'Iniciar Sesión · By Fekas Corp.' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], title: 'Resumen Operativo · By Fekas Corp.' },
  { path: 'piscinas', component: PiscinasListComponent, canActivate: [authGuard], title: 'Piscinas y Estanques · By Fekas Corp.' },
  { path: 'form-muestreo', component: FormMuestreoComponent, canActivate: [authGuard], title: 'Muestreo Biométrico · By Fekas Corp.' },
  { path: 'form-agua', component: FormAguaComponent, canActivate: [authGuard], title: 'Calidad del Agua · By Fekas Corp.' },
  { path: 'form-alimentacion', component: FormAlimentacionComponent, canActivate: [authGuard], title: 'Alimentación · By Fekas Corp.' },
  { path: 'compras', component: ComprasComponent, canActivate: [authGuard], title: 'Compras y Proveedores · By Fekas Corp.' },
  { path: '**', redirectTo: 'dashboard' }
];
