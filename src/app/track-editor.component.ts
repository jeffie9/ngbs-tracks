import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Track, rotatePointsArray, angleBetweenPoints } from './track';
import { TrackService } from './track.service';

const MM_PER_IN = 25.400051;

@Component({
    selector: 'app-track-editor',
    templateUrl: './track-editor.component.html',
    styleUrls: ['./track-editor.component.css']
})
export class TrackEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvas') canvas : ElementRef<HTMLCanvasElement>;
    private canvasContext: CanvasRenderingContext2D;
    private valueChanges: Subscription;
    private trackSelected: Subscription;
    scale = 2;
    track: Track;
    trackForm = this.fb.group({
        straight: this.fb.group({
            length: ['']
        }),
        curve: this.fb.group({
            radius: [''],
            sweep: ['']
        }),
        turnout: this.fb.group({
            length: [''],
            radius: [''],
            sweep: ['']
        }),
        crossing: this.fb.group({
            length: [''],
            angle: ['']
        }),
    });

    constructor(
            private fb: FormBuilder,
            private trackService: TrackService) {}
    
    ngOnInit() {
        this.trackSelected = this.trackService.trackSelected$.subscribe(
            track => {
                this.track = track;
                this.drawTrack();
                this.updateForm();
            }
        );
        this.track = this.trackService.selectedTrack;
        this.valueChanges = this.trackForm.valueChanges.subscribe(e => {
            this.updateTrack(e);
        });

        // this.track = this.crossing(5 * 25.400051, 30);
        // this.trackService.getTrackLibrary().push(this.track);
        // this.updateForm();
    }

    ngAfterViewInit() {
        //let rect = this.canvas.nativeElement.parentElement.getBoundingClientRect() as DOMRect;
        //this.canvas.nativeElement.height = window.innerHeight - rect.y + window.scrollY - 15;
        //this.canvas.nativeElement.width = rect.width;
        this.canvasContext = this.canvas.nativeElement.getContext('2d');
        this.canvasContext.translate(this.canvas.nativeElement.width / 2, this.canvas.nativeElement.height / 2);
        this.canvasContext.scale(this.scale, this.scale);
        this.drawTrack();
    }

    ngOnDestroy() {
        this.trackSelected.unsubscribe();
        this.valueChanges.unsubscribe();
    }

    drawTrack() {
        this.canvasContext.clearRect(-this.canvas.nativeElement.width / 2, -this.canvas.nativeElement.height / 2, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        if (this.track) {
            this.canvasContext.stroke(this.track.outline);
            // temporary markers
            this.canvasContext.beginPath();
            this.canvasContext.ellipse(0, 0, 2, 2, 0, 0, 2 * Math.PI);
            this.canvasContext.fill();
            this.track.paths.forEach(p => {
                this.canvasContext.beginPath();
                this.canvasContext.ellipse(p.x1, p.y1, 2, 2, 0, 0, 2 * Math.PI);
                this.canvasContext.fill();
                this.canvasContext.beginPath();
                this.canvasContext.ellipse(p.x2, p.y2, 2, 2, 0, 0, 2 * Math.PI);
                this.canvasContext.fill();
            });
        }
    }

    updateForm() {
        console.log('updateForm');
        this.trackForm.reset({}, {emitEvent: false});
        let fg = this.trackForm.get(this.track.type) as FormGroup;
        let paths = this.track.paths;       
        switch (this.track.type) {
        case 'straight':
            fg.get('length').setValue(Math.abs(paths[0].x2 - paths[0].x1) / MM_PER_IN, {emitEvent: false});
            break;
        case 'curve':
            fg.get('radius').setValue(paths[0].r / MM_PER_IN, {emitEvent: false});
            fg.get('sweep').setValue(paths[0].calcSweep() * 180 / Math.PI, {emitEvent: false});
            break;
        case 'turnout':
            fg.get('length').setValue(Math.abs(paths[0].x2 - paths[0].x1) / MM_PER_IN, {emitEvent: false});
            fg.get('radius').setValue(paths[1].r / MM_PER_IN, {emitEvent: false});
            fg.get('sweep').setValue(paths[1].calcSweep() * 180 / Math.PI, {emitEvent: false});
            break;
        case 'crossing':
            fg.get('length').setValue(Math.abs(paths[0].x2 - paths[0].x1) / MM_PER_IN, {emitEvent: false});
            fg.get('angle').setValue(angleBetweenPoints(0, 0, paths[0].x1, paths[0].y1, paths[1].x1, paths[1].y1) * 180 / Math.PI, {emitEvent: false});
            break;
        }
    }

    updateTrack(e: any) {
        console.log('updateTrack', e);
        let newTrack: Track;
        switch (this.track.type) {
        case 'straight':
            newTrack = this.straightTrack(e.straight.length * MM_PER_IN);
            break;
        case 'curve':
            newTrack = this.curveTrack(e.curve.radius * MM_PER_IN, e.curve.sweep);
            break;
        case 'turnout':
            if (this.track.paths[0].x1 == this.track.paths[1].x1
                    && this.track.paths[0].y1 == this.track.paths[1].y1) {
                newTrack = this.rightTurnout(e.turnout.length * MM_PER_IN, e.turnout.radius * MM_PER_IN, e.turnout.sweep);
            } else {
                newTrack = this.leftTurnout(e.turnout.length * MM_PER_IN, e.turnout.radius * MM_PER_IN, e.turnout.sweep);
            }
            break;
        case 'crossing':
            newTrack = this.crossing(e.crossing.length * MM_PER_IN, e.crossing.angle);
            break;
        }
        this.track.paths = newTrack.paths;
        this.track.outline = newTrack.outline;
        this.track.svg = newTrack.svg;
        this.drawTrack();
    }

    straightTrack(len: number): Track {
        let pts = Track.straightPoints(len, 20);
        return Track.fromData({
            id: 1,
            paths: [
                { x1: pts[0], y1: pts[1], x2: pts[2], y2: pts[3] }
            ],
            outline: `M ${pts[6]} ${pts[7]} L ${pts[8]} ${pts[9]} L ${pts[10]} ${pts[11]} L ${pts[12]} ${pts[13]} Z`
        });
    }
  
    curveTrack(radius: number, sweep: number): Track {
        let pts = Track.curvePoints(radius, sweep, 20);
        let path = `
            M ${pts[6]} ${pts[7]}
            A ${radius + 10} ${radius + 10} 0 0 1 ${pts[8]} ${pts[9]}
            L ${pts[10]} ${pts[11]} 
            A ${radius - 10} ${radius - 10} 0 0 0 ${pts[12]} ${pts[13]} Z`;
        console.log(path);
        return Track.fromData({
            id: 2,
            paths: [
                { x1: pts[0], y1: pts[1], x2: pts[2], y2: pts[3], xc: pts[4], yc: pts[5], r: radius }
            ],
            outline: path
        });
    }

    turnoutFromPoints(ptsMain: number[], ptsBranch: number[], radius: number, width: number): Track {
        let halfWidth = width / 2;
        let path = `
            M ${ptsMain[6]} ${ptsMain[7]} L ${ptsMain[8]} ${ptsMain[9]} L ${ptsMain[10]} ${ptsMain[11]} L ${ptsMain[12]} ${ptsMain[13]} Z
            M ${ptsBranch[6]} ${ptsBranch[7]}
            A ${radius + halfWidth} ${radius + halfWidth} 0 0 1 ${ptsBranch[8]} ${ptsBranch[9]}
            L ${ptsBranch[10]} ${ptsBranch[11]} 
            A ${radius - halfWidth} ${radius - halfWidth} 0 0 0 ${ptsBranch[12]} ${ptsBranch[13]} Z`;
        return Track.fromData({
            id: 3,
            paths: [
                { x1: ptsMain[0], y1: ptsMain[1], x2: ptsMain[2], y2: ptsMain[3] },
                { x1: ptsBranch[0], y1: ptsBranch[1], x2: ptsBranch[2], y2: ptsBranch[3], xc: ptsBranch[4], yc: ptsBranch[5], r: radius },
            ],
            outline: path
        });
    }

    leftTurnout(len: number, radius: number, sweep: number): Track {
        let ptsMain = Track.straightPoints(len, 20);
        let ptsBranch = Track.curvePoints(radius, sweep, 20);
        // we know the curve is symetric about the y axis
        let rads = -sweep * Math.PI / 360.0;
        ptsBranch = rotatePointsArray(Math.cos(rads), Math.sin(rads), 0, 0, ptsBranch);
        let dx = ptsMain[2] - ptsBranch[2];
        let dy = ptsMain[3] - ptsBranch[3];
        ptsBranch = ptsBranch.map((pt, i) => {
            if (i % 2 === 0) return pt + dx;
            return pt + dy;
        });
        return this.turnoutFromPoints(ptsMain, ptsBranch, radius, 20);
    }

    rightTurnout(len: number, radius: number, sweep: number): Track {
        let ptsMain = Track.straightPoints(len, 20);
        let ptsBranch = Track.curvePoints(radius, sweep, 20);
        // we know the curve is symetric about the y axis
        let rads = sweep * Math.PI / 360.0;
        ptsBranch = rotatePointsArray(Math.cos(rads), Math.sin(rads), 0, 0, ptsBranch);
        let dx = ptsMain[0] - ptsBranch[0];
        let dy = ptsMain[1] - ptsBranch[1];
        ptsBranch = ptsBranch.map((pt, i) => {
            if (i % 2 === 0) return pt + dx;
            return pt + dy;
        });
        return this.turnoutFromPoints(ptsMain, ptsBranch, radius, 20);
    }

    crossing(len: number, angle: number): Track {
        let rads = angle * Math.PI / 360.0;
        let pts1 = Track.straightPoints(len, 20);
        pts1 = rotatePointsArray(Math.cos(rads), Math.sin(rads), 0, 0, pts1);
        let pts2 = Track.straightPoints(len, 20);
        pts2 = rotatePointsArray(Math.cos(-rads), Math.sin(-rads), 0, 0, pts2);

        return Track.fromData({
            id: 5,
            paths: [
                { x1: pts1[0], y1: pts1[1], x2: pts1[2], y2: pts1[3] },
                { x1: pts2[0], y1: pts2[1], x2: pts2[2], y2: pts2[3] }
            ],
            outline: `M ${pts1[6]} ${pts1[7]} L ${pts1[8]} ${pts1[9]} L ${pts1[10]} ${pts1[11]} L ${pts1[12]} ${pts1[13]} Z
                      M ${pts2[6]} ${pts2[7]} L ${pts2[8]} ${pts2[9]} L ${pts2[10]} ${pts2[11]} L ${pts2[12]} ${pts2[13]} Z`,
            type: 'crossing'
        });
    }

}
