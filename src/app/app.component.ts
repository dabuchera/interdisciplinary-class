import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'interdisziplinary-course';

  constructor(@Inject(DOCUMENT) private document: Document) {}
  public openSpinner() {
    this.document.getElementById('spinner').style.height = '100%';
  }

  public closeSpinner() {
    this.document.getElementById('spinner').style.height = '0%';
  }

  public openOverlay() {
    document.getElementById('overlay').style.height = '100%';
  }

  public closeOverlay() {
    document.getElementById('overlay').style.height = '0%';
  }
}
