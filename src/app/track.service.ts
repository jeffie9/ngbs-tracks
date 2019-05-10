import { Injectable } from '@angular/core';
import { Track, TrackRef } from './track';
import { TRACK_LIBRARY } from './mock-library-data';
import { Subject, combineLatest, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

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
    private menuSelectedSource = new Subject<string>();
    menuSelected$ = this.menuSelectedSource.asObservable();

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
            Track.straightTrack(inchesToScaleFeet(this.selectedScale, 6), '6" Straight'),
            Track.curveTrack(inchesToScaleFeet(this.selectedScale, 10), degreesToRadians(22.5), '10" Radius Full Curve'),
            Track.crossing(inchesToScaleFeet(this.selectedScale, 6), degreesToRadians(30), '30° Crossing'),
            Track.turnout(inchesToScaleFeet(this.selectedScale, 6), 5, true, '#5 Turnout Left'),
            Track.turnout(inchesToScaleFeet(this.selectedScale, 6), 5, false, '#5 Turnout Right'),
            Track.turnout(inchesToScaleFeet(this.selectedScale, 8), 10, true, '#10 Turnout Left'),
            Track.turnout(inchesToScaleFeet(this.selectedScale, 8), 10, false, '#10 Turnout Right'),
            Track.curveTurnout(inchesToScaleFeet(this.selectedScale, 21.25), inchesToScaleFeet(this.selectedScale, 12), degreesToRadians(22.5), true, '21.25" Radius Turnout Left'),
            Track.curveTurnout(inchesToScaleFeet(this.selectedScale, 21.25), inchesToScaleFeet(this.selectedScale, 12), degreesToRadians(22.5), false, '21.25" Radius Turnout Right'),
            Track.wyeTurnout(inchesToScaleFeet(this.selectedScale, 6), 2.5, '#2.5 Wye Turnout'),
            Track.wyeTurnout(inchesToScaleFeet(this.selectedScale, 5), 3.5, '#3.5 Wye Turnout'),
        ];
        this.trackLibrary.forEach((t, i) => t.id = i);

        return this.trackLibrary;
    }

    selectTrack(t: Track) {
        this.selectedTrack = t;
        this.trackSelectedSource.next(t);
    }

    selectMenuItem(menuId: string) {
        this.menuSelectedSource.next(menuId);
    }

    saveTrackLibrary() {
        const doc = this.db.collection('libraries').doc('generic');
        const tc = doc.collection('tracks');
        this.trackLibrary.forEach(t => {
            tc.doc('' + t.id).set(t.toData());
        });
    }

    loadLayoutFromDatabase(name: string): Observable<any> {
        const doc = this.db.collection('layouts').doc(name);
        const tc = doc.collection('tracks');
        const trc = doc.collection('trackrefs');
        return combineLatest(doc.get(), tc.get(), trc.get())
        .pipe(
            map(([tdoc, trackdocs, trackrefdocs]) => {
                let response = {
                    length: tdoc.data().length,
                    width: tdoc.data().width,
                    tracks: new Array<Track>(),
                    trackrefs: new Array<TrackRef>()
                };
                let trackMap = new Map<number, Track>();
                trackdocs.docs.forEach(d => {
                    let t = Track.fromData(d.data());
                    trackMap.set(d.data().id, t);
                    response.tracks.push(t);
                });
                trackrefdocs.forEach(d => {
                    let tr = d.data();
                    response.trackrefs.push(new TrackRef(
                        trackMap.get(tr.trackId),
                        tr.xc,
                        tr.yc,
                        tr.rot
                    ));
                });
                return response;
            })
        );
    }

    saveLayoutToDatabase(layout: TrackRef[], name: string, length: number, width: number) {
        let trackMap = new Map<number, Track>(layout.map(t => [t.track.id, t.track] as [number, Track]));
        let library = new Set<Track>(trackMap.values());

        const doc = this.db.collection('layouts').doc(name);
        doc.set({
            length: length,
            width: width
        })
        const tc = doc.collection('tracks');
        library.forEach(t => {
            tc.doc('' + t.id).set(t.toData());
        });
        const trc = doc.collection('trackrefs');
        layout.forEach((t, i) => {
            trc.doc('' + i).set({
                trackId: t.track.id,
                xc: t.xc,
                yc: t.yc,
                rot: t.rot
            });
        });
    }
}
