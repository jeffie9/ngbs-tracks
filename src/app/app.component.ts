import { AfterContentInit, Component, ViewChild, ViewChildren, ContentChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Track, TrackRef } from './track';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {
    @ViewChild('wrapper') wrapper !: ElementRef;
    @ViewChild('canvas') canvas !: ElementRef<HTMLCanvasElement>;
    @ViewChild('glass') glass !: ElementRef<HTMLCanvasElement>;
    title = 'ngbs-tracks';
    canvasX: number;
    canvasY: number;
    private canvasContext: CanvasRenderingContext2D;
    private glassContext: CanvasRenderingContext2D;
    startX: number;
    startY: number;
    dragging = false;
    svgPath = new Path2D('M-39.02 3.84 A 200 200 0 0 1 39.02 3.84 L 35.12 23.46 A 180 180 0 0 0 -35.12 23.46 Z');
    trackLibrary = new Array<Track>();
    tracks = new Array<TrackRef>();

    ngOnInit() {
        this.trackLibrary.push(Track.fromData({
            id: 1,
            paths: [
                { x1: -39.02, y1: 3.84, x2: 39.02, y2: 3.84, xc: 0, yc: 200, r: 200 }
            ],
            outline: 'M-39.02 3.84 A 200 200 0 0 1 39.02 3.84 L 35.12 23.46 A 180 180 0 0 0 -35.12 23.46 Z'
        }));
        this.trackLibrary.push(Track.fromData({
            id: 2,
            paths: [
                { x1: -40, y1: 0, x2: 40, y2: 0 }
            ],
            outline: 'M-40 -10 L 40 -10 L 40 10 L -40 10 Z'
        }));

        this.tracks.push(new TrackRef(this.trackLibrary[0], 100, 100, 30.0 * Math.PI / 180.0));
        this.tracks.push(new TrackRef(this.trackLibrary[1], 200, 200, 45.0 * Math.PI / 180.0));

    }

    ngAfterViewInit() {
        console.log('ngAfterViewInit', this.wrapper, this.canvas, this.glass);
        let rect = this.canvas.nativeElement.getBoundingClientRect() as DOMRect;
        console.log(rect);
        this.canvasX = rect.x + window.scrollX;
        this.canvasY = rect.y + window.scrollY;
        
        this.canvas.nativeElement.height = window.innerHeight - this.canvasY - 2;
        this.canvas.nativeElement.width = this.wrapper.nativeElement.offsetWidth;
        //this.canvas.nativeElement.width = window.innerWidth - this.canvasX;
        this.canvasContext = this.canvas.nativeElement.getContext('2d');

        this.glass.nativeElement.height = window.innerHeight - this.canvasY - 2;
        this.glass.nativeElement.width = this.wrapper.nativeElement.offsetWidth;
        this.glassContext = this.glass.nativeElement.getContext('2d');

        this.drawCanvas();
    }

    drawCanvas() {
        this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        this.canvasContext.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        this.tracks
            .filter(tr => !tr.selected || !this.dragging)
            .forEach(tr => {
                this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
                this.canvasContext.translate(tr.xc, tr.yc);
                this.canvasContext.rotate(tr.rot);
                this.canvasContext.stroke(tr.track.outline);
            });
    }

    drawGlass(offsetX: number, offsetY: number) {
        this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
        this.glassContext.clearRect(0, 0, this.glass.nativeElement.width, this.glass.nativeElement.height);
        this.tracks.filter(tr => tr.selected)
        .forEach(tr => {
            this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
            this.glassContext.translate(tr.xc + offsetX, tr.yc + offsetY);
            this.glassContext.rotate(tr.rot);
            this.glassContext.stroke(tr.track.outline);
        });
    }

    mouseDown(e: MouseEvent) {
        console.log('mouseDown', e);
        // tell the browser we're handling this mouse event
        e.preventDefault();
        e.stopPropagation();
        
        const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

        // get the current mouse position
        let mx = e.clientX - rect.left;
        let my = e.clientY - rect.top;

        console.log('mouse down', mx, my);

        // if shift down or no selected tracks, find track under mouse and set selected
        let selectedTracks = this.tracks.filter(tr => tr.selected);
        this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        let trackAtPoint = this.tracks.find(tr => {
            // translate the mouse point into Track coordinates
            let px = mx - tr.xc;
            let py = my - tr.yc;
            let c = Math.cos(-tr.rot);
            let s = Math.sin(-tr.rot);
            let nx = c * px - s * py;
            let ny = s * px + c * py;
            console.log('point in path', nx, ny, this.canvasContext.isPointInPath(tr.track.outline, nx, ny));
            return this.canvasContext.isPointInPath(tr.track.outline, nx, ny);
        });
        // TODO handle shift and no trackAtPoint
        if (!!trackAtPoint) {
            trackAtPoint.selected = true;
        }
        

        // save the current mouse position
        this.startX = mx;
        this.startY = my;
        this.dragging = true;

        this.drawCanvas();
        this.drawGlass(0, 0);

    }

    mouseMove(e) {
        if (this.dragging) {
            // tell the browser we're handling this mouse event
            e.preventDefault();
            e.stopPropagation();
    
            const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

            // get the current mouse position
            let mx = e.clientX - rect.left;
            let my = e.clientY - rect.top;
                
            this.drawGlass(mx - this.startX, my - this.startY);
    
        }
    }

    mouseUp(e) {
        console.log('mouseUp', e);
        if (this.dragging) {
            // tell the browser we're handling this mouse event
            e.preventDefault();
            e.stopPropagation();
    
            const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

            // get the current mouse position
            let mx = e.clientX - rect.left;
            let my = e.clientY - rect.top;
            
            this.tracks.filter(tr => tr.selected).forEach(tr => {
                tr.xc += mx - this.startX;
                tr.yc += my - this.startY;
            });

            // clear all the dragging flags
            this.dragging = false;
            this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
            this.glassContext.clearRect(0, 0, this.glass.nativeElement.width, this.glass.nativeElement.height);
            
            this.drawCanvas();
    
        }
    }
}
