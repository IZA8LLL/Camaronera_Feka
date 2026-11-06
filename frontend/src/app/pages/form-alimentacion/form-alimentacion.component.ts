import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderFormAlimentacion, initFormAlimentacion } from '../../../pages/form-alimentacion/form-alimentacion.page';

@Component({
  selector: 'app-form-alimentacion',
  standalone: true,
  template: ''
})
export class FormAlimentacionComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderFormAlimentacion();
    initFormAlimentacion();
  }
}
