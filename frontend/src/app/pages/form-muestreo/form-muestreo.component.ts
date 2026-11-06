import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderFormMuestreo, initFormMuestreo } from '../../../pages/form-muestreo/form-muestreo.page';

@Component({
  selector: 'app-form-muestreo',
  standalone: true,
  template: ''
})
export class FormMuestreoComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderFormMuestreo();
    initFormMuestreo();
  }
}
