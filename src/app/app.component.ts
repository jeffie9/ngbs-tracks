import { Component } from '@angular/core';
import { TrackService } from './track.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'ngbs-tracks';
    view = 'layout';

    constructor(
        public trackService: TrackService) {}

    setView(view: string) {
      this.view = view;
    }
}
