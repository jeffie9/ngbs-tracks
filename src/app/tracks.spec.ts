import { Track, TrackRef, TrackPath } from './track';


describe('Tracks', () => {
    let tS80 = new Track();
    tS80.paths = [new TrackPath(-40, 0, 40, 0)];
    let tCF133 = new Track();
    tCF133.paths = [new TrackPath(-26.012042935483763, 2.5619626129026187, 26.012042935483763, 2.5619626129026187, 0, 133.33333333333334, 133.33333333333334)];
    let tX30 = new Track();
    tX30.paths = [
        new TrackPath(-38.63703305156273, -10.35276180410083, -38.63703305156273, 10.35276180410083),
        new TrackPath(-38.63703305156273, 10.35276180410083, -38.63703305156273, -10.35276180410083)
    ];
    let tTL5 = new Track();
    tTL5.paths = [
        new TrackPath(-40, 0, 40, 0),
        new TrackPath(-38.446454055273605, 15.689290811054724, 40, 0, 39.999999999999986, 203.9607805437113, 203.9607805437113)
    ];
    let tTR5 = new Track();
    tTR5.paths = [
        new TrackPath(-40, 0, 40, 0),
        new TrackPath(-40, 0, 38.44645405527355, 15.689290811054713, -39.99999999999999, 203.9607805437112, 203.9607805437112)
    ];


    describe('snap', () => {
        it('turnouts at branches', () => {
            let tc1 = new TrackRef(tTL5, 38, -15, 0);
            let tc2 = new TrackRef(tTR5, -15, 45, Math.PI / 2 /*1.570796327*/);

            let res = tc2.snapTo(tc1);

            console.log('res', res, res.da * 180 / Math.PI);
        });
    });

    describe('paths', () => {
        it('calc angle for curve', () => {
            let r = 100;
            let x2 = Math.cos(22.5 * Math.PI / 180) * r;
            let y2 = Math.sin(22.5 * Math.PI / 180) * r;
            
            let tp = new TrackPath(0, 0, x2, y2, 100, 0, 100);

            let a = tp.calcAngleAtPoint(x2, y2);
            console.log('angle at point', x2, y2, a * 180 / Math.PI);
        });

        it('transforms identity', () => {
            let transformed = tCF133.paths[0].transform(1, 0, 0, 0);

            expect(transformed).toEqual(tCF133.paths[0]);
        });

        it('transforms 90 degrees', () => {
            let transformed = tCF133.paths[0].transform(0, 1, 0, 0);
            console.log(transformed);
        });
    });
});