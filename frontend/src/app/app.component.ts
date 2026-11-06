import { Component, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, ElementRef } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { getUser, logout } from '../services/auth.service';
import { icon } from '../shared/ui';
import { initNavigation, renderNavigation } from '../shared/navigation';
import { initThemeToggle, renderThemeToggle } from '../shared/theme';
import { SafeHtmlPipe } from './shared/safe-html.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SafeHtmlPipe],
  template: `
    @if (isLoginRoute) {
      <main id="router-outlet">
        <router-outlet></router-outlet>
      </main>
    } @else {
      <a class="skip-link" href="#router-outlet" id="skip-content" (click)="onSkipClick($event)">Ir al contenido</a>
      <div class="layout">
        <aside class="layout__sidebar" id="app-sidebar" aria-label="Navegación principal">
          <a class="sidebar-brand" href="#/dashboard" aria-label="By Fekas Corp., inicio">
            <span class="brand-mark" [innerHTML]="iconPools | safeHtml"></span>
            <span class="sidebar-brand__text"><strong>by fekas<span class="brand-dot">.</span></strong><small>GESTIÓN ACUÍCOLA</small></span>
          </a>
          <button class="btn btn--ghost mobile-menu-close" id="btn-close-menu" aria-label="Cerrar menú" [innerHTML]="iconClose | safeHtml"></button>
          <div class="workspace-label"><span class="workspace-monogram">BF</span><div><strong>By Fekas Corp.</strong><small>Espacio de trabajo</small></div></div>
          <nav class="sidebar-nav" aria-label="Módulos del ERP" [innerHTML]="navHtml | safeHtml"></nav>
          <div class="sidebar-footer"><span [innerHTML]="iconWater | safeHtml"></span><div><strong>Del campo a la gestión.</strong><span>Una operación, una visión.</span></div></div>
        </aside>
        <button id="menu-backdrop" class="menu-backdrop" hidden tabindex="-1" aria-label="Cerrar menú"></button>
        <div class="layout__content">
          <header class="layout__topbar">
            <div class="topbar__context">
              <button id="btn-toggle-menu" class="btn btn--ghost mobile-menu-toggle" aria-label="Abrir menú" aria-controls="app-sidebar" aria-expanded="false" [innerHTML]="iconMenu | safeHtml"></button>
              <span class="topbar__workspace">Espacio de trabajo</span><span class="topbar__divider" aria-hidden="true">/</span><span class="topbar__title">{{ currentTitle }}</span>
            </div>
            <div class="topbar__actions">
              <span [innerHTML]="themeToggleHtml | safeHtml"></span>
              <div class="topbar__user">
                <div class="topbar__avatar" aria-hidden="true">{{ userInitial }}</div>
                <div class="topbar__identity">
                  <span class="topbar__name">{{ userName }}</span>
                  <span class="topbar__email">{{ userEmail }}</span>
                </div>
              </div>
              <button class="btn btn--ghost btn--sm" id="btn-logout" (click)="onLogout()" title="Cerrar sesión" aria-label="Cerrar sesión">
                <span [innerHTML]="iconLogout | safeHtml"></span><span class="logout-label">Salir</span>
              </button>
            </div>
          </header>
          <main class="layout__main" id="router-outlet" tabindex="-1">
            <router-outlet></router-outlet>
          </main>
          <footer class="layout__footer"><span>By Fekas Corp.</span><span>Gestión acuícola integral</span></footer>
        </div>
      </div>
    }
  `
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  isLoginRoute = false;
  currentTitle = 'Dashboard de Operaciones';
  currentPath = '/dashboard';
  userName = 'Usuario';
  userEmail = '';
  userInitial = 'U';

  iconPools = icon('pools');
  iconClose = icon('close');
  iconWater = icon('water');
  iconMenu = icon('menu');
  iconLogout = icon('logout');
  navHtml = renderNavigation('/dashboard');
  themeToggleHtml = renderThemeToggle();

  private sub?: Subscription;
  private disposeNav?: () => void;

  constructor(private router: Router, private el: ElementRef) {}

  ngOnInit(): void {
    this.updateContext();
    this.sub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateContext();
        setTimeout(() => {
          this.rebindUi();
        }, 0);
      });
  }

  ngAfterViewInit(): void {
    this.rebindUi();
  }

  ngAfterViewChecked(): void {
    this.el.nativeElement.querySelectorAll('[data-back]').forEach((btn: HTMLElement) => {
      if (!btn.dataset['boundBack']) {
        btn.dataset['boundBack'] = 'true';
        btn.addEventListener('click', () => history.back());
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.disposeNav?.();
  }

  onSkipClick(event: Event): void {
    event.preventDefault();
    this.el.nativeElement.querySelector('#router-outlet')?.focus();
  }

  async onLogout(): Promise<void> {
    if (confirm('¿Está seguro de cerrar sesión en By Fekas Corp.?')) {
      await logout();
      this.router.navigate(['/login']);
    }
  }

  private updateContext(): void {
    const rawUrl = this.router.url.split('?')[0];
    this.currentPath = rawUrl && rawUrl !== '/' ? rawUrl : '/dashboard';
    this.isLoginRoute = this.currentPath.includes('login');

    const user = getUser();
    this.userName = user?.nombre || 'Usuario';
    this.userEmail = user?.email || '';
    this.userInitial = (this.userName.charAt(0) || 'U').toUpperCase();

    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard de Operaciones',
      '/piscinas': 'Piscinas y Estanques',
      '/form-muestreo': 'Muestreo Biométrico',
      '/form-agua': 'Calidad del Agua',
      '/form-alimentacion': 'Registro de Alimentación',
      '/compras': 'Compras y Proveedores',
      '/login': 'Iniciar Sesión'
    };
    this.currentTitle = titles[this.currentPath] || 'By Fekas Corp.';
    this.navHtml = renderNavigation(this.currentPath);
    this.themeToggleHtml = renderThemeToggle();
  }

  private rebindUi(): void {
    this.disposeNav?.();
    this.disposeNav = undefined;
    if (!this.isLoginRoute && document.getElementById('app-sidebar') && document.getElementById('btn-toggle-menu')) {
      this.disposeNav = initNavigation();
    }
    initThemeToggle(this.el.nativeElement);
  }
}
