import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Track, TrackRef, rotatePoints } from './track';
import { TrackService } from './track.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('wrapper') wrapper !: ElementRef;
  @ViewChild('canvas') canvas !: ElementRef<HTMLCanvasElement>;
  @ViewChild('glass') glass !: ElementRef<HTMLCanvasElement>;
  private canvasContext: CanvasRenderingContext2D;
  private glassContext: CanvasRenderingContext2D;
  private trackLibrarySelected: Subscription;
  startX: number;
  startY: number;
  dragging = false;
  trackLibrary: Track[];
  tracks = new Array<TrackRef>();

  constructor(
      private trackService: TrackService) {}

  ngOnInit() {
      this.trackLibrary = this.trackService.getTrackLibrary();
      this.trackLibrarySelected = this.trackService.trackSelected$
        .subscribe(track => this.addNewTrack(track));
  }

  ngAfterViewInit() {
      console.log('ngAfterViewInit', this.wrapper, this.canvas, this.glass);
      let rect = this.canvas.nativeElement.getBoundingClientRect() as DOMRect;
      console.log(rect);
      let canvasX = rect.x + window.scrollX;
      let canvasY = rect.y + window.scrollY;
      
      this.canvas.nativeElement.height = window.innerHeight - canvasY - 2;
      this.canvas.nativeElement.width = this.wrapper.nativeElement.offsetWidth;
      //this.canvas.nativeElement.width = window.innerWidth - this.canvasX;
      this.canvasContext = this.canvas.nativeElement.getContext('2d');

      this.glass.nativeElement.height = window.innerHeight - canvasY - 2;
      this.glass.nativeElement.width = this.wrapper.nativeElement.offsetWidth;
      this.glassContext = this.glass.nativeElement.getContext('2d');

      this.drawCanvas();
  }

  ngOnDestroy() {
    this.trackLibrarySelected.unsubscribe();
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
              // temporary markers
              this.canvasContext.beginPath();
              this.canvasContext.ellipse(tr.track.paths[0].x1, tr.track.paths[0].y1, 3, 3, 0, 0, 2 * Math.PI);
              this.canvasContext.fill();
              this.canvasContext.beginPath();
              this.canvasContext.ellipse(tr.track.paths[0].x2, tr.track.paths[0].y2, 3, 3, 0, 0, 2 * Math.PI);
              this.canvasContext.fill();
              this.canvasContext.beginPath();
              this.canvasContext.ellipse(0, 0, 3, 3, 0, 0, 2 * Math.PI);
              this.canvasContext.fill();
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

      if (e.shiftKey) {
          if (!!trackAtPoint) {
              trackAtPoint.selected = !trackAtPoint.selected;
          } // else noop
      } else {
          if (trackAtPoint) {
              trackAtPoint.selected = true;

              // save the current mouse position
              this.startX = mx;
              this.startY = my;
              this.dragging = true;

              this.drawCanvas();
              this.drawGlass(0, 0);
          } else {
              // deselect everything
              this.tracks.filter(tr => tr.selected)
                  .forEach(t => t.selected = false);
              // TODO start rectangle select
          }
      }

  }

  mouseMove(e: MouseEvent) {
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

  mouseUp(e: MouseEvent) {
      console.log('mouseUp', e);
      if (this.dragging) {
          // tell the browser we're handling this mouse event
          e.preventDefault();
          e.stopPropagation();
  
          const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

          // get the current mouse position
          let mx = e.clientX - rect.left;
          let my = e.clientY - rect.top;
          
          // move the tracks before finding the closest pair
          let selectedTracks = this.tracks.filter(tr => tr.selected);
          selectedTracks.forEach(tr => {
              tr.xc += mx - this.startX;
              tr.yc += my - this.startY;
          });

          let unselectedTracks = this.tracks.filter(tr => !tr.selected);

          let pair = TrackRef.findClosestPair(selectedTracks, unselectedTracks);

          if (pair) {
            let diff = pair[0].snapTo(pair[1]);
            console.log('snap', diff);
            let cos = Math.cos(diff.da);
            let sin = Math.sin(diff.da);
            selectedTracks.forEach(tr => {
                tr.xc += diff.dx;
                tr.yc += diff.dy;
                tr.rot += diff.da;
                let pts = rotatePoints(cos, sin, diff.x, diff.y, tr.xc- diff.x, tr.yc - diff.y);
                tr.xc = pts[0];
                tr.yc = pts[1];
            });
          }

          // clear all the dragging flags
          this.dragging = false;
          this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
          this.glassContext.clearRect(0, 0, this.glass.nativeElement.width, this.glass.nativeElement.height);
          
          this.drawCanvas();
  
      }
  }

    addNewTrack(t: Track) {
        let tr = new TrackRef(t, 50, 50, 0);
        //tr.selected = true;
        this.tracks.push(tr);
        this.drawCanvas();
    }

    loadLayout() {
        this.trackService.loadLayoutFromDatabase('myfirst')
        .subscribe(res => {
            this.tracks = res.trackrefs;
            this.drawCanvas();
        });
    }

    saveLayout() {
        this.trackService.saveLayoutToDatabase(this.tracks, 'myfirst');
    }
}
