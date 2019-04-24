import { Injectable } from '@angular/core';
import { Track } from './track';
import { TRACK_LIBRARY } from './mock-library-data';
import { Subject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';

export function inchesToScaleFeet(scale: Scale, n: number): number {
    return scale.ratio * n / 12;
}

export function degreesToRadians(degrees: number): number {
    return Math.PI * degrees / 180.0;
}

export interface Scale {
    ratio: number;
}

export const SCALES = new Map<string, Scale>([
    ['O', {ratio: 45}],
    ['HO', {ratio: 87}],
    ['N', {ratio: 160}],
]);

@Injectable({
    providedIn: 'root'
})
export class TrackService {
    private trackLibrary: Track[];
    selectedTrack: Track;
    private trackSelectedSource = new Subject<Track>();
    trackSelected$ = this.trackSelectedSource.asObservable();
    selectedScale = SCALES.get('N');

    constructor(
        private db: AngularFirestore) { 
        this.trackLibrary;
        //this.selectedTrack = this.trackLibrary[0];
    }

    getTrackLibrary() {
        // this.trackLibrary = TRACK_LIBRARY.map(d => Track.fromData(d));

        // this.trackLibrary = new Array<Track>();
        // const tc = this.db.collection('libraries/generic/tracks');
        // tc.get().subscribe(t => {
        //     t.docs.forEach(d => {
        //         console.log(d.data());
        //         this.trackLibrary.push(Track.fromData(d.data()));
        //     });
        //     this.selectedTrack = this.trackLibrary[0];
        // });

        this.trackLibrary = [
            Track.straightTrack(inchesToScaleFeet(this.selectedScale, 6)),
            Track.curveTrack(inchesToScaleFeet(this.selectedScale, 10), degreesToRadians(22.5)),
            Track.crossing(inchesToScaleFeet(this.selectedScale, 6), degreesToRadians(30)),
            Track.turnout(inchesToScaleFeet(this.selectedScale, 6), 5, true),
            Track.turnout(inchesToScaleFeet(this.selectedScale, 6), 5, false),
            Track.curveTurnout(inchesToScaleFeet(this.selectedScale, 21.25), inchesToScaleFeet(this.selectedScale, 12), degreesToRadians(22.5), true),
            Track.curveTurnout(inchesToScaleFeet(this.selectedScale, 21.25), inchesToScaleFeet(this.selectedScale, 12), degreesToRadians(22.5), false),
        ];

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
