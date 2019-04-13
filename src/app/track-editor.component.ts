import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Track, rotatePoints, rotatePointsArray } from './track';

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
        //this.track = this.curveTrack(200, 22.5);
        this.track = this.rightTurnout(6 * 25.400051, 12 * 25.400051, 360.0 / 16);
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

}
