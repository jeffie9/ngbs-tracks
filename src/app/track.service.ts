import { Injectable } from '@angular/core';
import { Track } from './track';
import { TRACK_LIBRARY } from './mock-library-data';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TrackService {
    private trackLibrary: Track[];
    selectedTrack: Track;
    private trackSelectedSource = new Subject<Track>();
    trackSelected$ = this.trackSelectedSource.asObservable();

    constructor() { 
        this.trackLibrary = TRACK_LIBRARY.map(d => Track.fromData(d));
        this.selectedTrack = this.trackLibrary[0];
    }

    getTrackLibrary() {
        return this.trackLibrary;
    }

    selectTrack(t: Track) {
        this.selectedTrack = t;
        this.trackSelectedSource.next(t);
    }

}
