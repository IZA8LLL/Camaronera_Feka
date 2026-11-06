import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderFormAgua, initFormAgua } from '../../../pages/form-agua/form-agua.page';

@Component({
  selector: 'app-form-agua',
  standalone: true,
  template: ''
})
export class FormAguaComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderFormAgua();
    initFormAgua();
  }
}
