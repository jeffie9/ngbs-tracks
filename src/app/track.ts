export function rotatePointsArray(
        cos: number,
        sin: number,
        x: number,
        y: number,
        coords: number[]): number[] {
    for (let i = 0; i < coords.length; i += 2) {
        if (typeof coords[i] !== 'undefined' && typeof coords[i+1] !== 'undefined') {
            let newX = cos * coords[i] - sin * coords[i+1] + x;
            coords[i+1] = sin * coords[i] + cos * coords[i+1] + y;
            coords[i] = newX;
        }
    }
    return coords;
}

export function rotatePoints(
        cos: number,
        sin: number,
        x: number,
        y: number,
        ...coords: number[]): number[] {
    return rotatePointsArray(cos, sin, x, y, coords);
}

export function translatePointsArray(
        x: number,
        y: number,
        coords: number[]): number[] {
    for (let i = 0; i < coords.length; i += 2) {
        if (typeof coords[i] !== 'undefined' && typeof coords[i+1] !== 'undefined') {
            coords[i] = coords[i] + x;
            coords[i+1] = coords[i+1] + y;
        }
    }
    return coords;
}

export function translatePoints(
        x: number,
        y: number,
        ...coords: number[]): number[] {
    return translatePointsArray(x, y, coords);
}

export function angleBetweenPoints(
        xc: number, yc: number,
        x1: number, y1: number,
        x2: number, y2: number): number {
    let a = Math.abs(Math.atan2(y1 - yc, x1 - xc) - Math.atan2(y2 - yc, x2 - xc));
    if (a > 2 * Math.PI) {
        console.log('reduce a', a, a - 2 * Math.PI);
        a -= 2 * Math.PI;
    } else if (a < 0) {
        console.log('increase a', a, a + 2 * Math.PI);
        a += 2 * Math.PI;
    }
    return a;
}

// prototype tie spacing ~ 19-21 inches
// prototype tie length ~ 8-8.5 feet
export const SCALE_WIDTH = 8.5;
export const HALF_SCALE_WIDTH = 4.25;

export enum TrackType {
    Straight = 'straight',
    Curve = 'curve',
    Crossing = 'crossing',
    LeftTurnout = 'left-turnout',
    RightTurnout = 'right-turnout',
    WyeTurnout = 'wye-turnout',
    LeftCurvedTurnout = 'left-curved-turnout',
    RightCurvedTurnout = 'right-curved-turnout',
}

export class TrackPath {
    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public xc?: number,
        public yc?: number,
        public r?: number) {}

    static straightPath(length: number): TrackPath {
        let halfLength = length / 2;
        return new TrackPath(-halfLength, 0, halfLength, 0);
    }

    static curvePath(radius: number, sweep: number): TrackPath {
        // half the angle rotated to human north
        let a = (sweep + Math.PI) / 2;
        let xc = 0;
        let yc = radius;
        let dx = Math.cos(a);
        let dy = Math.sin(a);
        let x1 = xc - dx * radius;
        let y1 = yc - dy * radius;
        return new TrackPath(-x1, y1, x1, y1, xc, yc, radius);
    }

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
        let trx = rotatePoints(cos, sin, x, y, this.x1, this.y1, this.x2, this.y2, this.xc, this.yc);
        return new TrackPath(trx[0], trx[1], trx[2], trx[3], trx[4], trx[5], this.r);
    }

    rotate(a: number, x: number = 0, y: number = 0) {
        [this.x1, this.y1, this.x2, this.y2, this.xc, this.yc] = 
            rotatePoints(Math.cos(a), Math.sin(a), x, y,
            this.x1, this.y1, this.x2, this.y2, this.xc, this.yc);
    }

    translate(x: number, y: number) {
        [this.x1, this.y1, this.x2, this.y2, this.xc, this.yc] = 
            translatePoints(x, y,
            this.x1, this.y1, this.x2, this.y2, this.xc, this.yc);
    }

    closestPointTo(that: TrackPath): number[] {
        let dists = [
            Math.sqrt((this.x1 - that.x1)*(this.x1 - that.x1)+(this.y1 - that.y1)*(this.y1 - that.y1)),
            Math.sqrt((this.x1 - that.x2)*(this.x1 - that.x2)+(this.y1 - that.y2)*(this.y1 - that.y2)),
            Math.sqrt((this.x2 - that.x1)*(this.x2 - that.x1)+(this.y2 - that.y1)*(this.y2 - that.y1)),
            Math.sqrt((this.x2 - that.x2)*(this.x2 - that.x2)+(this.y2 - that.y2)*(this.y2 - that.y2)),
        ];

        let min = dists[0];
        let minIndex = 0;
        for (let i = 1; i < dists.length; i++) {
            if (dists[i] < min) {
                min = dists[i];
                minIndex = i;
            }
        }

        switch (minIndex) {
        case 0:
            return [that.x1, that.y1, this.x1, this.y1, dists[0]];
        case 1:
            return [that.x2, that.y2, this.x1, this.y1, dists[1]];
        case 2:
            return [that.x1, that.y1, this.x2, this.y2, dists[2]];
        case 3:
            return [that.x2, that.y2, this.x2, this.y2, dists[3]];
        }
    }

    calcSweep(): number {
        if (this.r && this.r > 0) {
            // a curved path
            return angleBetweenPoints(this.xc, this.yc, this.x1, this.y1, this.x2, this.y2);
        } else {
            // a straight path
            return 0;
        }
    }

    outline(): string {
        if (this.r > 0) {
            return this.curveOutline();
        } else {
            return this.straightOutline();
        }
    }

    straightOutline(): string {
        let x = this.x2 - this.x1;
        let y = this.y2 - this.y1;
        let length = Math.sqrt(x * x + y * y);
        let halfLength = length / 2;

        let a = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
        let pts = rotatePoints(Math.cos(a), Math.sin(a), 0, 0, -halfLength, -HALF_SCALE_WIDTH, halfLength, -HALF_SCALE_WIDTH, halfLength, HALF_SCALE_WIDTH, -halfLength, HALF_SCALE_WIDTH);
        pts = translatePointsArray((this.x2 + this.x1) / 2, (this.y2 + this.y1) / 2, pts);

        return `M ${pts[0]} ${pts[1]} L ${pts[2]} ${pts[3]} L ${pts[4]} ${pts[5]} L ${pts[6]} ${pts[7]} Z `;
    }

    curveOutline(): string {
        let a = (angleBetweenPoints(this.xc, this.yc, this.x1, this.y1, this.x2, this.y2) + Math.PI) / 2;
        let xc = 0;
        let yc = this.r;
        let dx = Math.cos(a);
        let dy = Math.sin(a);
        let tx = xc - dx * (this.r + HALF_SCALE_WIDTH);
        let ty = yc - dy * (this.r + HALF_SCALE_WIDTH);
        let bx = xc - dx * (this.r - HALF_SCALE_WIDTH);
        let by = yc - dy * (this.r - HALF_SCALE_WIDTH);

        // points are centered on 0,0 - rotation is found by the tilt in the endpoints
        a = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
        let pts = rotatePoints(Math.cos(a), Math.sin(a), 0, 0, xc, yc, -tx, ty, tx, ty, bx, by, -bx, by);
        // translate by the difference between 0,0 and the new path center
        pts = translatePoints(this.xc - pts[0], this.yc - pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[7], pts[8], pts[9]);

        return `M ${pts[0]} ${pts[1]} ` +
            `A ${this.r + HALF_SCALE_WIDTH} ${this.r + HALF_SCALE_WIDTH} 0 0 1 ${pts[2]} ${pts[3]} ` +
            `L ${pts[4]} ${pts[5]} ` +
            `A ${this.r - HALF_SCALE_WIDTH} ${this.r - HALF_SCALE_WIDTH} 0 0 0 ${pts[6]} ${pts[7]} Z `;
    }

}

export class Track {
    public id: number;
    public paths: TrackPath[];
    public outline: Path2D;
    public svg: string;
    public type: string;
    public label: string;

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
        t.svg = data.outline;
        t.outline = new Path2D(data.outline);
        t.type = data.type;
        t.label = data.label;
        return t;
    }    

    static fromParts(id: number, paths: TrackPath[], outline: string, type: string, label: string): Track {
        let track = new Track();
        track.id = id;
        track.paths = paths;
        track.svg = outline;
        track.outline = new Path2D(outline);
        track.type = type;
        track.label = label;
        return track;
    }

    public toData(): any {
        return {
            id: this.id,
            paths: this.paths.map(e => {
                let t = {
                    x1: e.x1,
                    y1: e.y1,
                    x2: e.x2,
                    y2: e.y2
                };
                if (e.xc != null) t['xc'] = e.xc;
                if (e.yc != null) t['yc'] = e.yc;
                if (e.r != null) t['r'] = e.r;
                return t;
            }),
            outline: this.svg,
            type: this.type,
            label: this.label
        };
    }

    public static straightTrack(length: number, label: string = ''): Track {
        let tp = TrackPath.straightPath(length);
        return Track.fromParts(0,
            [tp],
            tp.outline(),
            'straight',
            label);
    }

    public static curveTrack(radius: number, sweep: number, label: string = ''): Track {
        let tp = TrackPath.curvePath(radius, sweep);
        return Track.fromParts(0,
            [tp],
            tp.outline(),
            'curve',
            label);
    }

    public static crossing(length: number, angle: number, label: string = ''): Track {
        let tp1 = TrackPath.straightPath(length);
        let tp2 = TrackPath.straightPath(length);
        tp1.rotate(angle / 2);
        tp2.rotate(-angle / 2);
        return Track.fromParts(0,
            [ tp1, tp2 ],
            tp1.outline() + tp2.outline(),
            'crossing',
            label);
    }

    public static turnout(length: number, tNumber: number, left: boolean, label: string = ''): Track {
        let rads = Math.atan2(1, tNumber) * (left ? -1 : 1);
        let tpMain = TrackPath.straightPath(length);
        // we know the curve is symetric about the y axis
        let a = Math.PI / 2 - rads;
        let r = Math.abs(length / (2 * Math.cos(a)));
        let s = Math.abs(Math.PI - 2 * a);
        let tpCurveBranch = TrackPath.curvePath(r, s);
        tpCurveBranch.rotate(rads);

        if (left) {
            tpCurveBranch.translate(tpMain.x2 - tpCurveBranch.x2, tpMain.y2 - tpCurveBranch.y2);
        } else {
            tpCurveBranch.translate(tpMain.x1 - tpCurveBranch.x1, tpMain.y1 - tpCurveBranch.y1);
        }

        return Track.fromParts(0,
            [ tpMain, tpCurveBranch ],
            tpMain.outline() + tpCurveBranch.outline(),
            'turnout',
            label);
    }

    public static curveTurnout(mRadius: number, bRadius: number, sweep: number, left: boolean, label: string = ''): Track {
        let tpMain = TrackPath.curvePath(mRadius, sweep);
        let a = (Math.PI - sweep) / 2;
        let xc = Math.cos(a) * (mRadius - bRadius) + tpMain.xc;
        let yc = Math.sin(a) * (mRadius - bRadius) - tpMain.yc;
        // TODO not exact, but close enough - need to find intersection of inscribed circle circumfrence and outer circle radial
        let bSweep = angleBetweenPoints(xc, yc, tpMain.x2, tpMain.y2, tpMain.x1, tpMain.y1);
        let tpBranch = TrackPath.curvePath(bRadius, bSweep);
        let rads = (bSweep - sweep) / 2 * (left ? -1 : 1);
        tpBranch.rotate(rads);
        if (left) {
            tpBranch.translate(tpMain.x2 - tpBranch.x2, tpMain.y2 - tpBranch.y2);
        } else {
            tpBranch.translate(tpMain.x1 - tpBranch.x1, tpMain.y1 - tpBranch.y1);
        }

        return Track.fromParts(0,
            [ tpMain, tpBranch ],
            tpMain.outline() + tpBranch.outline(),
            'turnout',
            label);
    }

    public static wyeTurnout(length: number, tNumber: number, label: string = ''): Track {
        let rads = Math.atan2(1, tNumber) / 2;
        let a = Math.PI / 2 - rads;
        let r = Math.abs(length / (2 * Math.cos(a)));
        let s = Math.abs(Math.PI - 2 * a);
        let tpMain = TrackPath.curvePath(r, s);
        let tpBranch = TrackPath.curvePath(r, s);
        tpMain.rotate(rads);
        tpBranch.rotate(Math.PI - rads);
        let d = (tpMain.y2 - tpBranch.y2) / 2;

        tpMain.translate(0, d);
        tpBranch.translate(0, -d);

        return Track.fromParts(0,
            [ tpMain, tpBranch ],
            tpMain.outline() + tpBranch.outline(),
            'turnout',
            label);
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
        // find point in common
        let thisTP: TrackPath,
            thatTP: TrackPath;
        
        let thisCos = Math.cos(this.rot);
        let thisSin = Math.sin(this.rot);
        let thatCos = Math.cos(that.rot);
        let thatSin = Math.sin(that.rot);
        console.log(thisCos, thisSin, thatCos, thatSin, this.xc, this.yc);

        // go through all track paths (there are four between two turnouts)
        let closeness = new Array<number[]>();
        for (thisTP of this.track.paths.map(tp => tp.transform(thisCos, thisSin, this.xc, this.yc))) {
            console.log('thisTP', thisTP);
            for (thatTP of that.track.paths.map(tp => tp.transform(thatCos, thatSin, that.xc, that.yc))) {
                console.log('thatTP', thatTP);
                closeness.push(thisTP.closestPointTo(thatTP));
            }
        }

        console.log('closeness', closeness);
        // find the closest two points
        let min = closeness[0][4];
        let minIndex = 0;
        for (let i = 1; i < closeness.length; i++) {
            if (closeness[i][4] < min) {
                min = closeness[i][4];
                minIndex = i;
            }
        }
        console.log('min', min, closeness[minIndex]);
        // finally, if they are close enough, return the data
        if (min < 2 * SCALE_WIDTH) {
            let targetX = closeness[minIndex][0];
            let targetY = closeness[minIndex][1];
            let myX = closeness[minIndex][2];
            let myY = closeness[minIndex][3];
            console.log('target', targetX, targetY);
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