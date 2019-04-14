import { Injectable } from '@angular/core';
import { Track } from './track';
import { TRACK_LIBRARY } from './mock-library-data';
import { Subject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class TrackService {
    private trackLibrary: Track[];
    selectedTrack: Track;
    private trackSelectedSource = new Subject<Track>();
    trackSelected$ = this.trackSelectedSource.asObservable();

    constructor(
        private db: AngularFirestore) { 
        this.trackLibrary; // = TRACK_LIBRARY.map(d => Track.fromData(d));
        //this.selectedTrack = this.trackLibrary[0];
    }

    getTrackLibrary() {
        this.trackLibrary = new Array<Track>();
        const tc = this.db.collection('libraries/generic/tracks');
        tc.get().subscribe(t => {
            t.docs.forEach(d => {
                console.log(d.data());
                this.trackLibrary.push(Track.fromData(d.data()));
            });
            this.selectedTrack = this.trackLibrary[0];
        });
        return this.trackLibrary;
    }

    selectTrack(t: Track) {
        this.selectedTrack = t;
        this.trackSelectedSource.next(t);
    }

    saveTrackLibrary() {
        const doc = this.db.collection('libraries').doc('generic');
        const tc = doc.collection('tracks');
        this.trackLibrary.forEach(t => {
            tc.doc('' + t.id).set(t.toData());
        });
    }
}
