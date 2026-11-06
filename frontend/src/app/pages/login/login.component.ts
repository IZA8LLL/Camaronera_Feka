import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderLogin, initLogin } from '../../../pages/login/login.page';
import { initThemeToggle } from '../../../shared/theme';

@Component({
  selector: 'app-login',
  standalone: true,
  template: ''
})
export class LoginComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderLogin();
    initThemeToggle(this.el.nativeElement);
    initLogin();
  }
}
