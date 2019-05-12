import { Injectable } from '@angular/core';
import { Track, TrackRef } from './track';
import { TRACK_LIBRARY } from './mock-library-data';
import { Subject, combineLatest, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Layout } from './layout';

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

    getLayouts(): Observable<Layout[]> {
        return this.db.collection('layouts').get().pipe(
            map(qs => {
                const layouts = new Array<Layout>();
                qs.forEach(d => {
                    const layout = new Layout();
                    layout.id = d.id;
                    layout.name = d.data().name;
                    layout.length = d.data().length;
                    layout.width = d.data().width;
                    layouts.push(layout);
                });
                return layouts;
            })
        );
    }

    loadLayoutFromDatabase(id: string): Observable<Layout> {
        const doc = this.db.collection('layouts').doc(id);
        const tc = doc.collection('tracks');
        const trc = doc.collection('trackrefs');
        return combineLatest([doc.get(), tc.get(), trc.get()])
        .pipe(
            map(([tdoc, trackdocs, trackrefdocs]) => {
                const layout = new Layout();
                layout.id = id;
                layout.name = tdoc.data().name;
                layout.length = tdoc.data().length;
                layout.width = tdoc.data().width;
                layout.tracks = new Array<Track>();
                layout.trackRefs = new Array<TrackRef>();
                const trackMap = new Map<number, Track>();
                trackdocs.docs.forEach(d => {
                    let t = Track.fromData(d.data());
                    trackMap.set(d.data().id, t);
                    layout.tracks.push(t);
                });
                trackrefdocs.forEach(d => {
                    const tr = d.data();
                    layout.trackRefs.push(new TrackRef(
                        trackMap.get(tr.trackId),
                        tr.xc,
                        tr.yc,
                        tr.rot
                    ));
                });
                return layout;
            })
        );
    }

    saveLayoutToDatabase(layout: Layout) {
        if (layout.id === undefined) {
            this.db.collection('layouts').add({
                name: layout.name,
                length: layout.length,
                width: layout.width
            })
            .then(docRef => {
                layout.id = docRef.id;
                this.saveLayoutToDatabase(layout);
            });
            return;
        }

        let trackMap = new Map<number, Track>(layout.trackRefs.map(t => [t.track.id, t.track] as [number, Track]));
        let library = new Set<Track>(trackMap.values());
        const doc = this.db.collection('layouts').doc(layout.id);
        doc.set({
            name: layout.name,
            length: layout.length,
            width: layout.width
        });
        const tc = doc.collection('tracks');
        library.forEach(t => {
            tc.doc('' + t.id).set(t.toData());
        });
        const trc = doc.collection('trackrefs');
        layout.trackRefs.forEach((t, i) => {
            trc.doc('' + i).set({
                trackId: t.track.id,
                xc: t.xc,
                yc: t.yc,
                rot: t.rot
            });
        });
    }
}
