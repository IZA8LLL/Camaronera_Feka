import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderCompras, initCompras } from '../../../pages/compras/compras.page';

@Component({
  selector: 'app-compras',
  standalone: true,
  template: ''
})
export class ComprasComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderCompras();
    initCompras();
  }
}
