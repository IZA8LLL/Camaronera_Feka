import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderDashboard, initDashboard } from '../../../pages/dashboard/dashboard.page';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: ''
})
export class DashboardComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderDashboard();
    initDashboard();
  }
}
