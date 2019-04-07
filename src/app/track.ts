export class TrackPath {
    constructor(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        xc: number,
        yc: number,
        public r: number) {}
}

export class Track {
    private id: number;
    private paths: TrackPath[];
    public outline: Path2D;

    static fromData(data: any): Track {
        let t = new Track();
        t.id = data.id;
        t.paths = data.paths.map(e => {
            return new TrackPath(
                data.x1,
                data.y1,
                data.x2,
                data.y2,
                data.xc,
                data.yc,
                data.r);
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
}