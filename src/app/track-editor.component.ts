import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Track } from './track';

@Component({
    selector: 'app-track-editor',
    templateUrl: './track-editor.component.html',
    styleUrls: ['./track-editor.component.css']
})
export class TrackEditorComponent implements OnInit, AfterViewInit {
    @ViewChild('canvas') canvas : ElementRef<HTMLCanvasElement>;
    private canvasContext: CanvasRenderingContext2D;
    scale = 2;
    track: Track;

    constructor() { }
    
    ngOnInit() {
        //this.track = this.straightTrack(150);
        this.track = this.curveTrack(200, 22.5);
        console.log(this.track);
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

    drawTrack() {
        this.canvasContext.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        if (this.track) {
            this.canvasContext.stroke(this.track.outline);
            // temporary markers
            this.canvasContext.beginPath();
            this.canvasContext.ellipse(this.track.paths[0].x1, this.track.paths[0].y1, 3, 3, 0, 0, 2 * Math.PI);
            this.canvasContext.fill();
            this.canvasContext.beginPath();
            this.canvasContext.ellipse(this.track.paths[0].x2, this.track.paths[0].y2, 3, 3, 0, 0, 2 * Math.PI);
            this.canvasContext.fill();
            this.canvasContext.beginPath();
            this.canvasContext.ellipse(0, 0, 3, 3, 0, 0, 2 * Math.PI);
            this.canvasContext.fill();
        }
    }

    straightTrack(len: number): Track {
        let half = len / 2;
        return Track.fromData({
            id: 1,
            paths: [
                { x1: -half, y1: 0, x2: half, y2: 0 }
            ],
            outline: `M -${half} -10 L ${half} -10 L ${half} 10 L -${half} 10 Z`
        });
    }
  
    curveTrack(radius: number, sweep: number) {
        //let a = sweep * Math.PI / 360.0 + Math.PI / 2;
        let a = Math.PI * (sweep / 360.0 + 0.5);
        let xc = 0;
        let yc = radius;
        let dx = Math.cos(a);
        let dy = Math.sin(a);
        let x1 = xc - dx * radius;
        let y1 = yc - dy * radius;
        let tx = xc - dx * (radius + 10);
        let ty = yc - dy * (radius + 10);
        let bx = xc - dx * (radius - 10);
        let by = yc - dy * (radius - 10);
        let path = `
            M ${-tx} ${ty}
            A ${radius + 10} ${radius + 10} 0 0 1 ${tx} ${ty}
            L ${bx} ${by} 
            A ${radius - 10} ${radius - 10} 0 0 0 ${-bx} ${by} Z`;
        console.log(path);
        return Track.fromData({
            id: 2,
            paths: [
                { x1: -x1, y1: y1, x2: x1, y2: y1, xc: xc, yc: yc, r: radius }
            ],
            outline: path
        });
    }
}
