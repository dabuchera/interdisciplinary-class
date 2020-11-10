import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'bim-lean';

  constructor(@Inject(DOCUMENT) private document: Document) {}
  public openSpinner() {
    this.document.getElementById('spinner').style.height = '100%';
  }

  public closeSpinner() {
    this.document.getElementById('spinner').style.height = '0%';
  }
}
