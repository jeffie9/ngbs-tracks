export class TrackPath {
    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public xc: number,
        public yc: number,
        public r: number) {}

    calcAngleAtPoint(x: number, y: number): number {
        let a: number;
        if (this.r && this.r > 0) {
            // a curved path
            a = Math.atan2(y - this.yc, x - this.xc);
            if (x === this.x1 && y === this.y1) {
                a += Math.PI / 2;
            } else {
                a -= Math.PI / 2;
            }
        } else {
            // a straight path
            if (x === this.x1 && y === this.y1) {
                a = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
            } else {
                a = Math.atan2(this.y1 - this.y2, this.x1 - this.x2);
            }
        }
        return a;
    }

    /**
     * Return a new TrackPath with given (abbreviated) transformation
     * @param cos 
     * @param sin 
     * @param x 
     * @param y 
     */
    transform(cos: number, sin: number, x: number, y: number): TrackPath {
        let xc: number;
        let yc: number;
        console.log('transform', this.xc, this.yc, (this.xc && this.yc));
        if (typeof this.xc !== 'undefined' && typeof this.yc !== 'undefined') {
            xc = cos * this.xc - sin * this.yc + x;
            yc = sin * this.xc + cos * this.yc + y;
        }
        return new TrackPath(
            cos * this.x1 - sin * this.y1 + x,
            sin * this.x1 + cos * this.y1 + y,
            cos * this.x2 - sin * this.y2 + x,
            sin * this.x2 + cos * this.y2 + y,
            xc,
            yc,
            this.r
        );
    }

    isClose(that: TrackPath, close: number): number[] {
        if (Math.abs(this.x1 - that.x1) < close
            && Math.abs(this.y1 - that.y1) < close) {
                return [that.x1, that.y1, this.x1, this.y1];
        } else if (Math.abs(this.x1 - that.x2) < close
            && Math.abs(this.y1 - that.y2) < close) {
                return [that.x2, that.y2, this.x1, this.y1];
        } else if (Math.abs(this.x2 - that.x1) < close
            && Math.abs(this.y2 - that.y1) < close) {
                return [that.x1, that.y1, this.x2, this.y2];
        } else if (Math.abs(this.x2 - that.x2) < close
            && Math.abs(this.y2 - that.y2) < close) {
                return [that.x2, that.y2, this.x2, this.y2];
        }
    }

}

export class Track {
    public id: number;
    public paths: TrackPath[];
    public outline: Path2D;

    static fromData(data: any): Track {
        let t = new Track();
        t.id = data.id;
        t.paths = data.paths.map(e => {
            return new TrackPath(
                e.x1,
                e.y1,
                e.x2,
                e.y2,
                e.xc,
                e.yc,
                e.r);
        });
        t.outline = new Path2D(data.outline);
        return t;
    }    

    private calculateOutline() {
        var path = new Path2D();

        this.paths.forEach(p => {
            // start with simple lines
            if (!!p.r) {
                // is an arc

            }
        });

        const r = 200;
        // half the sweep angle
        var a = 11.25 * Math.PI / 180.0;
        var x = 0;
        var y = 200;

        path.arc(x, y, r, Math.PI / -2 - a, Math.PI / -2 + a);
        // find where the arc ends
        x = Math.cos(Math.PI / -2 + a) * r + x;
        y = Math.sin(Math.PI / -2 + a) * r + y;
        console.log('right top', x, y);
        // find the perpendicular at the end of the arc
        x = Math.cos(Math.PI / -2 + a + Math.PI) * 20 + x;
        y = Math.sin(Math.PI / -2 + a + Math.PI) * 20 + y;
        console.log('right bottom', x, y);
        path.lineTo(x, y);
        path.arc(0, 200, r - 20, Math.PI / -2 + a, Math.PI / -2 - a, true);
        //path.lineTo(-39.02, 3.84);
        path.closePath();

    }
}

export class TrackRef {
    constructor (
        public track: Track,
        public xc: number,
        public yc: number,
        public rot: number) {}
    public selected = false;

    static findClosestPair(a: TrackRef[], b: TrackRef[]): TrackRef[] {
        let pairs = new Array<any>();
        a.forEach(st => {
            b.forEach(ut => {
                pairs.push({
                    st: st,
                    ut: ut,
                    dist: Math.sqrt(Math.pow(st.xc - ut.xc, 2) + Math.pow(st.yc - ut.yc, 2))
                });
            });
        });

        if (pairs.length > 0) {
            // TODO need more tracks to see if this sorts correctly
            pairs.sort((a, b) => a.dist - b.dist);
            return [pairs[0].st, pairs[0].ut];
        }
    }

    public snapTo(that: TrackRef): {x: number, y: number, dx: number, dy: number, da: number} {
        const close = 10;
        // find point in common
        let thisTP: TrackPath,
            thatTP: TrackPath,
            myX: number,
            myY: number,
            targetX: number,
            targetY: number;
        
        let thisCos = Math.cos(this.rot);
        let thisSin = Math.sin(this.rot);
        let thatCos = Math.cos(that.rot);
        let thatSin = Math.sin(that.rot);
        // nx = c * px - s * py;
        // ny = s * px + c * py;
        console.log(thisCos, thisSin, thatCos, thatSin);

        // for (thisTP of this.track.paths) {
        //     console.log(thisCos, thisTP, thisSin, this.xc);
        //     let thisX1 = thisCos * thisTP.x1 - thisSin * thisTP.y1 + this.xc;
        //     let thisY1 = thisSin * thisTP.x1 + thisCos * thisTP.y1 + this.yc;
        //     let thisX2 = thisCos * thisTP.x2 - thisSin * thisTP.y2 + this.xc;
        //     let thisY2 = thisSin * thisTP.x2 + thisCos * thisTP.y2 + this.yc;
        //     for (thatTP of that.track.paths) {
        //         let thatX1 = thatCos * thatTP.x1 - thatSin * thatTP.y1 + that.xc;
        //         let thatY1 = thatSin * thatTP.x1 + thatCos * thatTP.y1 + that.yc;
        //         let thatX2 = thatCos * thatTP.x2 - thatSin * thatTP.y2 + that.xc;
        //         let thatY2 = thatSin * thatTP.x2 + thatCos * thatTP.y2 + that.yc;
        //         console.log(thisX1, thisY1, thisX2, thisY2);
        //         console.log(thatX1, thatY1, thatX2, thatY2);
        //         if (Math.abs(thisX1 - thatX1) < close
        //             && Math.abs(thisY1 - thatY1) < close) {
        //                 targetX = thatX1;
        //                 targetY = thatY1;
        //                 myX = thisX1;
        //                 myY = thisY1;
        //                 break;
        //         } else if (Math.abs(thisX1 - thatX2) < close
        //             && Math.abs(thisY1 - thatY2) < close) {
        //                 targetX = thatX2;
        //                 targetY = thatY2;
        //                 myX = thisX1;
        //                 myY = thisY1;
        //                 break;
        //         } else if (Math.abs(thisX2 - thatX1) < close
        //             && Math.abs(thisY2 - thatY1) < close) {
        //                 targetX = thatX1;
        //                 targetY = thatY1;
        //                 myX = thisX2;
        //                 myY = thisY2;
        //                 break;
        //         } else if (Math.abs(thisX2 - thatX2) < close
        //             && Math.abs(thisY2 - thatY2) < close) {
        //                 targetX = thatX2;
        //                 targetY = thatY2;
        //                 myX = thisX2;
        //                 myY = thisY2;
        //                 break;
        //         }
        //     }
        // }

        closecheck:
        for (thisTP of this.track.paths.map(tp => tp.transform(thisCos, thisSin, this.xc, this.yc))) {
            for (thatTP of that.track.paths.map(tp => tp.transform(thatCos, thatSin, that.xc, that.yc))) {
                console.log(thisTP.x1, thisTP.y1, thisTP.x2, thisTP.y2);
                console.log(thatTP.x1, thatTP.y1, thatTP.x2, thatTP.y2);
                let closeness = thisTP.isClose(thatTP, 10);
                if (closeness) {
                    targetX = closeness[0];
                    targetY = closeness[1];
                    myX = closeness[2];
                    myY = closeness[3];
                    break closecheck;
                }
            }
        }

        if (targetX && targetY) {
            console.log(thisTP);
            console.log(thatTP);
            let a = thatTP.calcAngleAtPoint(targetX, targetY);
            console.log('that angle', a * 180 / Math.PI);
            let b = thisTP.calcAngleAtPoint(myX, myY) + Math.PI;
            console.log('this angle', b * 180 / Math.PI);
            return {
                x: targetX,
                y: targetY,
                dx: targetX - myX,
                dy: targetY - myY,
                da: a - b
            };
        }
        return {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            da: 0
        };
    }

}