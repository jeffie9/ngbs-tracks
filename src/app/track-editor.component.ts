import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Track, rotatePointsArray, angleBetweenPoints } from './track';
import { TrackService, inchesToScaleFeet, degreesToRadians } from './track.service';

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

    saveLibrary() {
        this.trackService.saveTrackLibrary();
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
        return Track.straightTrack(inchesToScaleFeet(this.trackService.selectedScale, len));
    }
  
    curveTrack(radius: number, sweep: number): Track {
        return Track.curveTrack(inchesToScaleFeet(this.trackService.selectedScale, radius), degreesToRadians(sweep));
    }

    leftTurnout(len: number, radius: number, sweep: number): Track {
        return Track.turnout(inchesToScaleFeet(this.trackService.selectedScale, len), 5, true);
    }

    rightTurnout(len: number, radius: number, sweep: number): Track {
        return Track.turnout(inchesToScaleFeet(this.trackService.selectedScale, len), 5, false);
    }

    crossing(len: number, angle: number): Track {
        return Track.crossing(inchesToScaleFeet(this.trackService.selectedScale, len), degreesToRadians(angle));
    }

}
