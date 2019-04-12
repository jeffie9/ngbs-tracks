import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'ngbs-tracks';
    view = 'track';

    setView(view: string) {
      this.view = view;
    }
}
