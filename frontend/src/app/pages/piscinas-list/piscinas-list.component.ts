import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { renderPiscinasList, initPiscinasList } from '../../../pages/piscinas-list/piscinas-list.page';

@Component({
  selector: 'app-piscinas-list',
  standalone: true,
  template: ''
})
export class PiscinasListComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.innerHTML = renderPiscinasList();
    initPiscinasList();
  }
}
